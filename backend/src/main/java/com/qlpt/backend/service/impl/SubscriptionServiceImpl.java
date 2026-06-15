package com.qlpt.backend.service.impl;

import com.qlpt.backend.service.SubscriptionService;

import com.qlpt.backend.enums.Role;
import com.qlpt.backend.entity.UpgradeRequest;
import com.qlpt.backend.entity.User;
import com.qlpt.backend.entity.SubscriptionPackage;
import com.qlpt.backend.exception.ResourceNotFoundException;
import com.qlpt.backend.repository.UpgradeRequestRepository;
import com.qlpt.backend.repository.UserRepository;
import com.qlpt.backend.repository.SubscriptionPackageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final UpgradeRequestRepository upgradeRequestRepository;
    private final UserRepository userRepository;
    private final com.qlpt.backend.service.NotificationService notificationService;
    private final com.qlpt.backend.service.SystemSettingService systemSettingService;
    private final SubscriptionPackageRepository subscriptionPackageRepository;

    @Value("${app.payos.client-id:}")
    private String adminPayosClientId;

    @Value("${app.payos.api-key:}")
    private String adminPayosApiKey;

    @Value("${app.payos.checksum-key:}")
    private String adminPayosChecksumKey;

    public SubscriptionServiceImpl(UpgradeRequestRepository upgradeRequestRepository,
                                   UserRepository userRepository,
                                   com.qlpt.backend.service.NotificationService notificationService,
                                   com.qlpt.backend.service.SystemSettingService systemSettingService,
                                   SubscriptionPackageRepository subscriptionPackageRepository) {
        this.upgradeRequestRepository = upgradeRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.systemSettingService = systemSettingService;
        this.subscriptionPackageRepository = subscriptionPackageRepository;
    }

    @Transactional
    @Override
    public UpgradeRequest createUpgradeRequest(User landlord, UUID packageId, String returnUrl, String cancelUrl) {
        if (landlord.getRole() != Role.LANDLORD) {
            throw new RuntimeException("Chỉ tài khoản chủ trọ mới có thể mua gói nâng cấp");
        }

        SubscriptionPackage pack = subscriptionPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ"));

        if (!pack.isActive()) {
            throw new RuntimeException("Gói dịch vụ này hiện tại không hoạt động");
        }

        // Xóa các yêu cầu PENDING cũ của landlord này để tránh lưu rác
        List<UpgradeRequest> oldRequests = upgradeRequestRepository.findByUserIdOrderByCreatedAtDesc(landlord.getId());
        for (UpgradeRequest oldReq : oldRequests) {
            if ("PENDING".equals(oldReq.getStatus())) {
                upgradeRequestRepository.delete(oldReq);
            }
        }

        int months = pack.getMonths();
        double amount = pack.getPrice();
        String paymentContent = generateUniquePaymentContent(landlord.getUsername());

        long orderCode = System.currentTimeMillis();
        String checkoutUrl = null;
        String paymentLinkId = null;

        PayOS payOS = getAdminPayOS();
        if (payOS != null) {
            try {
                String finalReturnUrl = (returnUrl != null && !returnUrl.trim().isEmpty()) ? returnUrl.trim() : "http://localhost:5173/landlord/dashboard";
                String finalCancelUrl = (cancelUrl != null && !cancelUrl.trim().isEmpty()) ? cancelUrl.trim() : "http://localhost:5173/landlord/dashboard";
                
                String desc = "Nang cap " + months + " thang";
                if (desc.length() > 25) {
                    desc = desc.substring(0, 25);
                }

                CreatePaymentLinkRequest checkoutRequest = CreatePaymentLinkRequest.builder()
                        .orderCode(orderCode)
                        .amount((long) amount)
                        .description(desc)
                        .returnUrl(finalReturnUrl)
                        .cancelUrl(finalCancelUrl)
                        .build();

                CreatePaymentLinkResponse paymentLinkData = payOS.paymentRequests().create(checkoutRequest);
                checkoutUrl = paymentLinkData.getCheckoutUrl();
                paymentLinkId = paymentLinkData.getPaymentLinkId();
            } catch (Exception e) {
                System.err.println("Lỗi tạo link thanh toán PayOS nâng cấp gói: " + e.getMessage());
            }
        }

        UpgradeRequest request = UpgradeRequest.builder()
                .user(landlord)
                .months(months)
                .amount(amount)
                .status("PENDING")
                .paymentContent(paymentContent)
                .payosOrderCode(checkoutUrl != null ? orderCode : null)
                .payosPaymentLinkId(paymentLinkId)
                .createdAt(LocalDateTime.now())
                .build();

        UpgradeRequest savedRequest = upgradeRequestRepository.save(request);

        // Tạo thông báo cho các tài khoản ADMIN
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            String title = "Yêu cầu nâng cấp gói mới";
            String content = String.format("Chủ trọ %s đã gửi yêu cầu nâng cấp gói %s (%d tháng). Vui lòng kiểm tra và phê duyệt.",
                    landlord.getFullName(), pack.getName(), months);
            for (User admin : admins) {
                notificationService.createNotification(admin, title, content, "SUBSCRIPTION_REQUEST");
            }
        } catch (Exception e) {
            // Không làm gián đoạn luồng nghiệp vụ chính của người dùng
            System.err.println("Lỗi khi gửi thông báo nâng cấp gói cho Admin: " + e.getMessage());
        }

        savedRequest.setCheckoutUrl(checkoutUrl);
        return savedRequest;
    }

    @Transactional
    @Override
    public List<UpgradeRequest> getMyRequests(User landlord) {
        List<UpgradeRequest> requests = upgradeRequestRepository.findByUserIdOrderByCreatedAtDesc(landlord.getId());
        List<UpgradeRequest> syncedRequests = new ArrayList<>();
        for (UpgradeRequest req : requests) {
            if ("PENDING".equals(req.getStatus()) && req.getPayosOrderCode() != null) {
                syncedRequests.add(syncPayosStatus(req));
            } else {
                syncedRequests.add(req);
            }
        }
        return syncedRequests;
    }

    @Transactional
    @Override
    public Map<String, Object> getActiveStatus(User landlord) {
        // Sync PayOS status for any PENDING requests first to ensure statusMap reflects the latest payment
        List<UpgradeRequest> requests = upgradeRequestRepository.findByUserIdOrderByCreatedAtDesc(landlord.getId());
        for (UpgradeRequest req : requests) {
            if ("PENDING".equals(req.getStatus()) && req.getPayosOrderCode() != null) {
                syncPayosStatus(req);
            }
        }

        // Fetch fresh landlord from database to get the updated subscriptionExpiredAt field
        User freshLandlord = userRepository.findById(landlord.getId()).orElse(landlord);

        Map<String, Object> statusMap = new HashMap<>();
        
        LocalDateTime regDateTime = freshLandlord.getCreatedAt() != null ? freshLandlord.getCreatedAt() : LocalDateTime.now().minusDays(50);
        LocalDate regDate = regDateTime.toLocalDate();
        LocalDate trialExpiredAt = regDate.plusDays(45);
        LocalDate subscriptionExpiredAt = freshLandlord.getSubscriptionExpiredAt();
        
        LocalDate today = LocalDate.now();
        
        boolean isTrialActive = !today.isAfter(trialExpiredAt);
        boolean isSubscriptionActive = subscriptionExpiredAt != null && !today.isAfter(subscriptionExpiredAt);
        boolean isExpired = !isTrialActive && !isSubscriptionActive;

        long trialDaysLeft = Math.max(0, ChronoUnit.DAYS.between(today, trialExpiredAt));
        long subscriptionDaysLeft = subscriptionExpiredAt != null ? Math.max(0, ChronoUnit.DAYS.between(today, subscriptionExpiredAt)) : 0;

        statusMap.put("createdAt", regDateTime);
        statusMap.put("trialExpiredAt", trialExpiredAt);
        statusMap.put("subscriptionExpiredAt", subscriptionExpiredAt);
        statusMap.put("isTrialActive", isTrialActive);
        statusMap.put("isSubscriptionActive", isSubscriptionActive);
        statusMap.put("isExpired", isExpired);
        statusMap.put("trialDaysLeft", trialDaysLeft);
        statusMap.put("subscriptionDaysLeft", subscriptionDaysLeft);
        statusMap.put("role", freshLandlord.getRole().name());
        
        return statusMap;
    }

    // ==========================================
    // ADMIN ACTIONS
    // ==========================================

    @Override
    public Page<UpgradeRequest> getPendingRequestsForAdmin(Pageable pageable) {
        return upgradeRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING", pageable);
    }

    @Override
    public Page<UpgradeRequest> getAllRequestsForAdmin(String status, Pageable pageable) {
        if (status == null || status.trim().isEmpty()) {
            return upgradeRequestRepository.findAll(pageable);
        }
        return upgradeRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Transactional
    @Override
    public UpgradeRequest approveRequest(UUID requestId) {
        UpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nâng cấp"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý từ trước");
        }

        User landlord = request.getUser();
        int months = request.getMonths();

        LocalDate currentExpiry = landlord.getSubscriptionExpiredAt();
        LocalDate newExpiry;
        
        if (currentExpiry != null && currentExpiry.isAfter(LocalDate.now())) {
            newExpiry = currentExpiry.plusMonths(months);
        } else {
            newExpiry = LocalDate.now().plusMonths(months);
        }

        landlord.setSubscriptionExpiredAt(newExpiry);
        userRepository.save(landlord);

        request.setStatus("APPROVED");
        request.setProcessedAt(LocalDateTime.now());
        
        UpgradeRequest saved = upgradeRequestRepository.save(request);

        // Gửi thông báo đến chủ trọ sau khi duyệt nâng cấp thành công
        try {
            String title = "Gia hạn tài khoản thành công";
            String content = String.format("Yêu cầu nâng cấp gói %d tháng của bạn đã được kích hoạt thành công. Hạn sử dụng mới là %s.",
                    months, newExpiry.toString());
            notificationService.createNotification(landlord, title, content, "SUBSCRIPTION_APPROVED", saved.getId());
        } catch (Exception ne) {
            System.err.println("Lỗi khi gửi thông báo đồng bộ duyệt gia hạn: " + ne.getMessage());
        }

        return saved;
    }

    @Transactional
    @Override
    public UpgradeRequest rejectRequest(UUID requestId) {
        UpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nâng cấp"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý từ trước");
        }

        request.setStatus("REJECTED");
        request.setProcessedAt(LocalDateTime.now());
        
        return upgradeRequestRepository.save(request);
    }

    @Transactional
    @Override
    public User extendLandlordSubscriptionManually(UUID landlordId, int months) {
        User landlord = userRepository.findById(landlordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ trọ"));

        if (landlord.getRole() != Role.LANDLORD) {
            throw new RuntimeException("Chỉ có thể gia hạn tài khoản chủ trọ");
        }

        LocalDate currentExpiry = landlord.getSubscriptionExpiredAt();
        LocalDate newExpiry;

        if (currentExpiry != null && currentExpiry.isAfter(LocalDate.now())) {
            newExpiry = currentExpiry.plusMonths(months);
        } else {
            newExpiry = LocalDate.now().plusMonths(months);
        }

        landlord.setSubscriptionExpiredAt(newExpiry);
        return userRepository.save(landlord);
    }

    // ==========================================
    // SUBSCRIPTION PACKAGE ACTIONS
    // ==========================================

    @Transactional
    @Override
    public SubscriptionPackage createPackage(SubscriptionPackage pack) {
        if (pack.getName() == null || pack.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên gói không được để trống");
        }
        if (pack.getMonths() == null || pack.getMonths() <= 0) {
            throw new RuntimeException("Số tháng gia hạn phải lớn hơn 0");
        }
        if (pack.getPrice() == null || pack.getPrice() < 0) {
            throw new RuntimeException("Giá tiền không hợp lệ");
        }
        return subscriptionPackageRepository.save(pack);
    }

    @Transactional
    @Override
    public SubscriptionPackage updatePackage(UUID id, SubscriptionPackage pack) {
        SubscriptionPackage existing = subscriptionPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ"));

        if (pack.getName() != null && !pack.getName().trim().isEmpty()) {
            existing.setName(pack.getName());
        }
        if (pack.getMonths() != null && pack.getMonths() > 0) {
            existing.setMonths(pack.getMonths());
        }
        if (pack.getPrice() != null && pack.getPrice() >= 0) {
            existing.setPrice(pack.getPrice());
        }
        existing.setDescription(pack.getDescription());
        existing.setActive(pack.isActive());

        return subscriptionPackageRepository.save(existing);
    }

    @Transactional
    @Override
    public void deletePackage(UUID id) {
        SubscriptionPackage existing = subscriptionPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ"));
        subscriptionPackageRepository.delete(existing);
    }

    @Override
    public List<SubscriptionPackage> getAllPackages() {
        return subscriptionPackageRepository.findAllByOrderByMonthsAsc();
    }

    @Override
    public List<SubscriptionPackage> getActivePackages() {
        return subscriptionPackageRepository.findByActiveTrueOrderByMonthsAsc();
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private String generateUniquePaymentContent(String username) {
        Random random = new Random();
        String content;
        do {
            int code = 1000 + random.nextInt(9000); // 4-digit code
            content = "GIAHAN " + username.toUpperCase() + " " + code;
        } while (upgradeRequestRepository.existsByPaymentContent(content));
        
        return content;
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

    private UpgradeRequest syncPayosStatus(UpgradeRequest request) {
        System.out.println("[PayOS Upgrade Sync] Bat dau dong bo yeu cau ID: " + request.getId() + ", OrderCode: " + request.getPayosOrderCode());
        PayOS payOS = getAdminPayOS();
        if (payOS == null) {
            System.out.println("[PayOS Upgrade Sync] Admin chua cau hinh PayOS (ca o database va file cau hinh), bo qua dong bo.");
            return request;
        }

        try {
            var paymentLinkData = payOS.paymentRequests().get(request.getPayosOrderCode());
            if (paymentLinkData != null) {
                System.out.println("[PayOS Upgrade Sync] Trang thai thanh toan tren PayOS: " + paymentLinkData.getStatus() + ", So tien da thanh toan: " + paymentLinkData.getAmountPaid());
                if ("PAID".equals(String.valueOf(paymentLinkData.getStatus()))) {
                    // Update the request status and upgrade subscription
                    UpgradeRequest approved = approveRequest(request.getId());
                    System.out.println("[PayOS Upgrade Sync] Cap nhat yeu cau ID " + request.getId() + " thanh cong sang APPROVED!");
                    return approved;
                } else {
                    System.out.println("[PayOS Upgrade Sync] Trang thai khong phai PAID. Bo qua cap nhat.");
                }
            } else {
                System.out.println("[PayOS Upgrade Sync] Khong tim thay thong tin link thanh toan tu PayOS.");
            }
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ trạng thái PayOS cho yeu cau nang cap " + request.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
        return request;
    }
}
