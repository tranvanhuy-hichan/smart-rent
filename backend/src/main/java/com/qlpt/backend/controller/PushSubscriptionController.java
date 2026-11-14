package com.qlpt.backend.controller;

import com.qlpt.backend.config.CustomUserDetails;
import com.qlpt.backend.config.VapidKeysConfig;
import com.qlpt.backend.entity.User;
import com.qlpt.backend.service.PushNotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/push-subscriptions")
public class PushSubscriptionController {

    private final PushNotificationService pushNotificationService;
    private final VapidKeysConfig vapidKeysConfig;

    public PushSubscriptionController(PushNotificationService pushNotificationService,
                                      VapidKeysConfig vapidKeysConfig) {
        this.pushNotificationService = pushNotificationService;
        this.vapidKeysConfig = vapidKeysConfig;
    }

    @GetMapping("/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", vapidKeysConfig.getPublicKey());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SubscribeRequest request) {
        User user = userDetails.getUser();
        pushNotificationService.subscribe(user, request.getEndpoint(), request.getP256dh(), request.getAuth());
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Đăng ký nhận thông báo đẩy thành công");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<Map<String, String>> unsubscribe(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UnsubscribeRequest request) {
        User user = userDetails.getUser();
        pushNotificationService.unsubscribe(user, request.getEndpoint());

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Hủy đăng ký nhận thông báo đẩy thành công");
        return ResponseEntity.ok(response);
    }

    @Data
    public static class SubscribeRequest {
        @NotBlank(message = "Endpoint không được để trống")
        private String endpoint;

        @NotBlank(message = "p256dh không được để trống")
        private String p256dh;

        @NotBlank(message = "auth không được để trống")
        private String auth;
    }

    @Data
    public static class UnsubscribeRequest {
        @NotBlank(message = "Endpoint không được để trống")
        private String endpoint;
    }
}
