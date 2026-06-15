package com.qlpt.backend.controller;

import com.qlpt.backend.config.CustomUserDetails;
import com.qlpt.backend.entity.BoardingHouse;
import com.qlpt.backend.entity.Invoice;
import com.qlpt.backend.entity.UpgradeRequest;
import com.qlpt.backend.entity.User;
import com.qlpt.backend.repository.InvoiceRepository;
import com.qlpt.backend.repository.UpgradeRequestRepository;
import com.qlpt.backend.service.InvoiceService;
import com.qlpt.backend.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.WebhookData;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final SubscriptionService subscriptionService;
    private final UpgradeRequestRepository upgradeRequestRepository;
    private final com.qlpt.backend.service.SystemSettingService systemSettingService;

    @Value("${app.payos.client-id:}")
    private String adminPayosClientId;

    @Value("${app.payos.api-key:}")
    private String adminPayosApiKey;

    @Value("${app.payos.checksum-key:}")
    private String adminPayosChecksumKey;

    public PaymentController(InvoiceService invoiceService,
            InvoiceRepository invoiceRepository,
            SubscriptionService subscriptionService,
            UpgradeRequestRepository upgradeRequestRepository,
            com.qlpt.backend.service.SystemSettingService systemSettingService) {
        this.invoiceService = invoiceService;
        this.invoiceRepository = invoiceRepository;
        this.subscriptionService = subscriptionService;
        this.upgradeRequestRepository = upgradeRequestRepository;
        this.systemSettingService = systemSettingService;
    }

    @GetMapping("/invoices/{invoiceId}/payos-link")
    public ResponseEntity<Map<String, Object>> getInvoicePayosLink(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) String returnUrl,
            @RequestParam(required = false) String cancelUrl,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User user = userDetails.getUser();
        Invoice invoice = invoiceService.getInvoiceById(invoiceId, user);

        BoardingHouse bh = invoice.getContract().getRoom().getBoardingHouse();

        if (bh.getPayosClientId() == null || bh.getPayosClientId().trim().isEmpty() ||
                bh.getPayosApiKey() == null || bh.getPayosApiKey().trim().isEmpty() ||
                bh.getPayosChecksumKey() == null || bh.getPayosChecksumKey().trim().isEmpty()) {
            throw new RuntimeException(
                    "Dãy trọ này chưa được cấu hình tài khoản thanh toán tự động PayOS. Vui lòng liên hệ chủ trọ.");
        }

        double remainingAmount = invoice.getTotalAmount() - invoice.getPaidAmount();
        if (remainingAmount <= 0) {
            throw new RuntimeException("Hóa đơn này đã được thanh toán đầy đủ.");
        }

        long orderCode = System.currentTimeMillis();

        // Cập nhật orderCode mới cho hóa đơn để tránh trùng lặp mã đơn hàng cũ trên
        // PayOS
        invoice.setPayosOrderCode(orderCode);
        invoiceRepository.save(invoice);

        try {
            PayOS payOS = new PayOS(
                    bh.getPayosClientId().trim(),
                    bh.getPayosApiKey().trim(),
                    bh.getPayosChecksumKey().trim());

            String defaultUrl = "http://localhost:5173/tenant/invoices/" + invoiceId;
            String finalReturnUrl = validateRedirectUrl(returnUrl, defaultUrl);
            String finalCancelUrl = validateRedirectUrl(cancelUrl, defaultUrl);

            // Description tối đa 25 ký tự
            String roomNum = invoice.getContract().getRoom().getRoomNumber();
            String desc = "HD Phong " + roomNum;
            if (desc.length() > 25) {
                desc = desc.substring(0, 25);
            }

            CreatePaymentLinkRequest checkoutRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount((long) remainingAmount)
                    .description(desc)
                    .returnUrl(finalReturnUrl)
                    .cancelUrl(finalCancelUrl)
                    .build();

            CreatePaymentLinkResponse paymentLinkData = payOS.paymentRequests().create(checkoutRequest);

            // Lưu lại Payment Link ID
            invoice.setPayosPaymentLinkId(paymentLinkData.getPaymentLinkId());
            invoiceRepository.save(invoice);

            return ResponseEntity.ok(Map.of(
                    "checkoutUrl", paymentLinkData.getCheckoutUrl(),
                    "orderCode", orderCode,
                    "paymentLinkId", paymentLinkData.getPaymentLinkId()));
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Không thể tạo liên kết thanh toán PayOS: " + e.getMessage());
        }
    }

    @GetMapping("/subscriptions/requests/{requestId}/payos-link")
    public ResponseEntity<Map<String, Object>> getSubscriptionPayosLink(
            @PathVariable UUID requestId,
            @RequestParam(required = false) String returnUrl,
            @RequestParam(required = false) String cancelUrl,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User landlord = userDetails.getUser();
        UpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new com.qlpt.backend.exception.ResourceNotFoundException(
                        "Không tìm thấy yêu cầu nâng cấp"));

        if (!request.getUser().getId().equals(landlord.getId())) {
            throw new RuntimeException("Bạn không có quyền truy cập yêu cầu nâng cấp này");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý");
        }

        PayOS payOS = getAdminPayOS();
        if (payOS == null) {
            throw new RuntimeException("Cổng thanh toán tự động của hệ thống chưa được cấu hình.");
        }

        long orderCode = request.getPayosOrderCode() != null ? request.getPayosOrderCode() : System.currentTimeMillis();
        if (request.getPayosOrderCode() == null) {
            request.setPayosOrderCode(orderCode);
            upgradeRequestRepository.save(request);
        }

        try {
            String finalReturnUrl = validateRedirectUrl(returnUrl, "http://localhost:5173/landlord/dashboard");
            String finalCancelUrl = validateRedirectUrl(cancelUrl, "http://localhost:5173/landlord/dashboard");

            String desc = "Nang cap " + request.getMonths() + " thang";
            if (desc.length() > 25) {
                desc = desc.substring(0, 25);
            }

            CreatePaymentLinkRequest checkoutRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(request.getAmount().longValue())
                    .description(desc)
                    .returnUrl(finalReturnUrl)
                    .cancelUrl(finalCancelUrl)
                    .build();

            CreatePaymentLinkResponse paymentLinkData = payOS.paymentRequests().create(checkoutRequest);
            request.setPayosPaymentLinkId(paymentLinkData.getPaymentLinkId());
            upgradeRequestRepository.save(request);

            return ResponseEntity.ok(Map.of("checkoutUrl", paymentLinkData.getCheckoutUrl()));
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo lại liên kết thanh toán PayOS: " + e.getMessage());
        }
    }

    @PostMapping("/payos-webhook")
    public ResponseEntity<Object> handlePayosWebhook(@RequestBody String webhookBody) {
        try {
            if (webhookBody == null || webhookBody.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid webhook payload"));
            }

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(webhookBody);
            JsonNode dataNode = rootNode.get("data");
            if (dataNode == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid webhook payload"));
            }

            JsonNode descNode = dataNode.get("desc");
            if (descNode != null && "confirm".equals(descNode.asText())) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Webhook confirmed successfully"));
            }

            Long orderCode = dataNode.get("orderCode") != null ? dataNode.get("orderCode").asLong() : null;
            if (orderCode == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing orderCode"));
            }

            // 1. Kiểm tra xem có phải hóa đơn tiền phòng của Khách thuê
            Optional<Invoice> invoiceOpt = invoiceRepository.findByPayosOrderCode(orderCode);
            if (invoiceOpt.isPresent()) {
                Invoice invoice = invoiceOpt.get();
                if ("PAID".equals(invoice.getStatus().name())) {
                    return ResponseEntity.ok(Map.of("success", true, "message", "Invoice already paid"));
                }
                BoardingHouse bh = invoice.getContract().getRoom().getBoardingHouse();

                if (bh.getPayosClientId() == null || bh.getPayosApiKey() == null || bh.getPayosChecksumKey() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Boarding house PayOS keys not configured"));
                }

                // Khởi tạo PayOS động theo từng dãy trọ
                PayOS payOS = new PayOS(
                        bh.getPayosClientId().trim(),
                        bh.getPayosApiKey().trim(),
                        bh.getPayosChecksumKey().trim());

                // Xác thực chữ ký webhook từ PayOS
                WebhookData verifiedData = payOS.webhooks().verify(webhookBody);

                if (verifiedData != null) {
                    // Cập nhật gạch nợ tự động
                    invoiceService.updatePaymentStatusAuto(invoice.getId(), verifiedData.getAmount());
                    return ResponseEntity.ok(Map.of("success", true, "message", "Invoice paid successfully"));
                }
            }

            // 2. Kiểm tra xem có phải yêu cầu nâng cấp gói dịch vụ của Chủ trọ
            Optional<UpgradeRequest> upgradeOpt = upgradeRequestRepository.findByPayosOrderCode(orderCode);
            if (upgradeOpt.isPresent()) {
                UpgradeRequest upgradeReq = upgradeOpt.get();
                if ("APPROVED".equals(upgradeReq.getStatus())) {
                    return ResponseEntity.ok(Map.of("success", true, "message", "Subscription already upgraded"));
                }

                PayOS payOS = getAdminPayOS();
                if (payOS == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Admin PayOS keys not configured"));
                }

                // Xác thực chữ ký webhook từ PayOS
                WebhookData verifiedData = payOS.webhooks().verify(webhookBody);

                if (verifiedData != null) {
                    // Duyệt tự động và nâng cấp tài khoản cho chủ trọ
                    subscriptionService.approveRequest(upgradeReq.getId());
                    return ResponseEntity.ok(Map.of("success", true, "message", "Subscription upgraded successfully"));
                }
            }

            return ResponseEntity.status(404).body(Map.of("message", "Order code not found"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Webhook verification failed. Please check payload and signature."));
        }
    }

    private String validateRedirectUrl(String url, String defaultUrl) {
        if (url == null || url.trim().isEmpty()) {
            return defaultUrl;
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("http://localhost:") || trimmed.startsWith("http://127.0.0.1:")) {
            return trimmed;
        }
        try {
            java.net.URI uri = new java.net.URI(trimmed);
            String host = uri.getHost();
            if (host == null || host.equals("localhost") || host.equals("127.0.0.1") || 
                host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.") ||
                host.endsWith("vercel.app") || host.contains("quanlyphongtro")) {
                return trimmed;
            }
        } catch (Exception e) {
            // ignore
        }
        return defaultUrl;
    }

    private PayOS getAdminPayOS() {
        var systemSetting = systemSettingService.getSetting();
        String clientId = systemSetting.getPayosClientId();
        String apiKey = systemSetting.getPayosApiKey();
        String checksumKey = systemSetting.getPayosChecksumKey();
        
        if (clientId == null || clientId.trim().isEmpty()) {
            clientId = adminPayosClientId;
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = adminPayosApiKey;
        }
        if (checksumKey == null || checksumKey.trim().isEmpty()) {
            checksumKey = adminPayosChecksumKey;
        }
        
        if (clientId == null || apiKey == null || checksumKey == null ||
            clientId.trim().isEmpty() || apiKey.trim().isEmpty() || checksumKey.trim().isEmpty()) {
            return null;
        }
        
        return new PayOS(clientId.trim(), apiKey.trim(), checksumKey.trim());
    }
}
