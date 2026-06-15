package com.qlpt.backend.controller;

import com.qlpt.backend.config.CustomUserDetails;
import com.qlpt.backend.dto.subscription.UpgradeRequestResponse;
import com.qlpt.backend.dto.user.UserResponse;
import com.qlpt.backend.entity.UpgradeRequest;
import com.qlpt.backend.entity.User;
import com.qlpt.backend.service.SubscriptionService;
import com.qlpt.backend.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.qlpt.backend.entity.SystemSetting;
import com.qlpt.backend.service.SystemSettingService;
import com.qlpt.backend.entity.SubscriptionPackage;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SystemSettingService systemSettingService;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  SystemSettingService systemSettingService) {
        this.subscriptionService = subscriptionService;
        this.systemSettingService = systemSettingService;
    }

    @GetMapping("/admin-bank-info")
    public ResponseEntity<SystemSetting> getAdminBankInfo(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SystemSetting setting = systemSettingService.getSetting();
        boolean isAdmin = userDetails != null && userDetails.getUser() != null && userDetails.getUser().getRole() == Role.ADMIN;
        
        SystemSetting responseSetting = SystemSetting.builder()
                .id(setting.getId())
                .phone(setting.getPhone())
                .email(setting.getEmail())
                .fullName(setting.getFullName())
                .payosClientId(isAdmin ? setting.getPayosClientId() : "")
                .payosApiKey(isAdmin ? (setting.getPayosApiKey() != null && !setting.getPayosApiKey().trim().isEmpty() ? "******" : "") : "")
                .payosChecksumKey(isAdmin ? (setting.getPayosChecksumKey() != null && !setting.getPayosChecksumKey().trim().isEmpty() ? "******" : "") : "")
                .build();
                
        return ResponseEntity.ok(responseSetting);
    }

    @PutMapping("/admin-bank-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSetting> updateAdminBankInfo(@RequestBody SystemSetting setting) {
        return ResponseEntity.ok(systemSettingService.updateSetting(setting));
    }

    @PostMapping("/request")
    public ResponseEntity<UpgradeRequestResponse> createRequest(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID packageId = null;
        if (payload.containsKey("packageId")) {
            packageId = UUID.fromString((String) payload.get("packageId"));
        } else {
            throw new RuntimeException("Vui lòng cung cấp mã gói cước.");
        }
        String returnUrl = (String) payload.get("returnUrl");
        String cancelUrl = (String) payload.get("cancelUrl");
        User landlord = userDetails.getUser();
        UpgradeRequest request = subscriptionService.createUpgradeRequest(landlord, packageId, returnUrl, cancelUrl);
        return ResponseEntity.ok(UpgradeRequestResponse.fromEntity(request));
    }

    // ==========================================
    // SUBSCRIPTION PACKAGES ENDPOINTS
    // ==========================================

    @GetMapping("/packages")
    public ResponseEntity<List<SubscriptionPackage>> getActivePackages() {
        return ResponseEntity.ok(subscriptionService.getActivePackages());
    }

    @GetMapping("/packages/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SubscriptionPackage>> getAllPackages() {
        return ResponseEntity.ok(subscriptionService.getAllPackages());
    }

    @PostMapping("/packages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubscriptionPackage> createPackage(@RequestBody SubscriptionPackage pack) {
        return ResponseEntity.ok(subscriptionService.createPackage(pack));
    }

    @PutMapping("/packages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubscriptionPackage> updatePackage(
            @PathVariable UUID id,
            @RequestBody SubscriptionPackage pack) {
        return ResponseEntity.ok(subscriptionService.updatePackage(id, pack));
    }

    @DeleteMapping("/packages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePackage(@PathVariable UUID id) {
        subscriptionService.deletePackage(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<UpgradeRequestResponse>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User landlord = userDetails.getUser();
        List<UpgradeRequest> requests = subscriptionService.getMyRequests(landlord);
        List<UpgradeRequestResponse> responses = requests.stream()
                .map(UpgradeRequestResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/active-status")
    public ResponseEntity<Map<String, Object>> getActiveStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User landlord = userDetails.getUser();
        Map<String, Object> status = subscriptionService.getActiveStatus(landlord);
        return ResponseEntity.ok(status);
    }

    // ==========================================
    // ADMIN ONLY ENDPOINTS
    // ==========================================

    @GetMapping("/admin/requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UpgradeRequestResponse>> getAllRequests(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<UpgradeRequest> requests = subscriptionService.getAllRequestsForAdmin(status, pageable);
        Page<UpgradeRequestResponse> responses = requests.map(UpgradeRequestResponse::fromEntity);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/admin/requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UpgradeRequestResponse> approveRequest(@PathVariable UUID id) {
        UpgradeRequest approved = subscriptionService.approveRequest(id);
        return ResponseEntity.ok(UpgradeRequestResponse.fromEntity(approved));
    }

    @PostMapping("/admin/requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UpgradeRequestResponse> rejectRequest(@PathVariable UUID id) {
        UpgradeRequest rejected = subscriptionService.rejectRequest(id);
        return ResponseEntity.ok(UpgradeRequestResponse.fromEntity(rejected));
    }

    @PostMapping("/admin/extend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> extendLandlord(
            @RequestBody Map<String, Object> payload) {
        UUID landlordId = UUID.fromString((String) payload.get("landlordId"));
        int months = ((Number) payload.get("months")).intValue();
        User landlord = subscriptionService.extendLandlordSubscriptionManually(landlordId, months);
        return ResponseEntity.ok(UserResponse.fromEntity(landlord));
    }
}
