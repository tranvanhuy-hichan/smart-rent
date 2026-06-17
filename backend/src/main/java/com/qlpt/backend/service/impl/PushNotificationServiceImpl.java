package com.qlpt.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qlpt.backend.config.VapidKeysConfig;
import com.qlpt.backend.entity.PushSubscription;
import com.qlpt.backend.entity.User;
import com.qlpt.backend.repository.PushSubscriptionRepository;
import com.qlpt.backend.service.PushNotificationService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Security;
import java.security.interfaces.ECPublicKey;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class PushNotificationServiceImpl implements PushNotificationService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final VapidKeysConfig vapidKeysConfig;
    private final ObjectMapper objectMapper;
    private PushService pushService;

    public PushNotificationServiceImpl(PushSubscriptionRepository pushSubscriptionRepository,
                                       VapidKeysConfig vapidKeysConfig,
                                       ObjectMapper objectMapper) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.vapidKeysConfig = vapidKeysConfig;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }

            pushService = new PushService();
            if (vapidKeysConfig.getPublicKey() != null && !vapidKeysConfig.getPublicKey().isEmpty()) {
                byte[] publicKeyBytes = Base64.getUrlDecoder().decode(vapidKeysConfig.getPublicKey());
                byte[] privateKeyBytes = Base64.getUrlDecoder().decode(vapidKeysConfig.getPrivateKey());

                pushService.setPublicKey(Utils.loadPublicKey(publicKeyBytes));
                pushService.setPrivateKey(Utils.loadPrivateKey(privateKeyBytes));
                pushService.setSubject(vapidKeysConfig.getSubject());
                log.info("PushService initialized successfully with VAPID credentials.");
            } else {
                log.warn("PushService initialization deferred: VAPID keys not generated/configured yet.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize PushService", e);
        }
    }

    @Transactional
    @Override
    public void subscribe(User user, String endpoint, String p256dh, String auth) {
        Optional<PushSubscription> existing = pushSubscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
            PushSubscription sub = existing.get();
            sub.setUser(user);
            sub.setP256dh(p256dh);
            sub.setAuth(auth);
            sub.setCreatedAt(LocalDateTime.now());
            pushSubscriptionRepository.save(sub);
            log.info("Updated push subscription for user: {}", user.getUsername());
        } else {
            PushSubscription sub = PushSubscription.builder()
                    .user(user)
                    .endpoint(endpoint)
                    .p256dh(p256dh)
                    .auth(auth)
                    .createdAt(LocalDateTime.now())
                    .build();
            pushSubscriptionRepository.save(sub);
            log.info("Created new push subscription for user: {}", user.getUsername());
        }
    }

    @Transactional
    @Override
    public void unsubscribe(User user, String endpoint) {
        Optional<PushSubscription> existing = pushSubscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
            PushSubscription sub = existing.get();
            if (sub.getUser().getId().equals(user.getId())) {
                pushSubscriptionRepository.delete(sub);
                log.info("Deleted push subscription for user: {}", user.getUsername());
            }
        }
    }

    @Async
    @Override
    public void sendPushNotification(User user, String title, String content, String type, UUID referenceId) {
        List<PushSubscription> subs = pushSubscriptionRepository.findByUserId(user.getId());
        if (subs.isEmpty()) {
            return;
        }

        // Lazy load PushService parameters if not initialized (e.g. if keys were generated after startup)
        if (pushService.getPublicKey() == null) {
            try {
                byte[] publicKeyBytes = Base64.getUrlDecoder().decode(vapidKeysConfig.getPublicKey());
                byte[] privateKeyBytes = Base64.getUrlDecoder().decode(vapidKeysConfig.getPrivateKey());
                pushService.setPublicKey(Utils.loadPublicKey(publicKeyBytes));
                pushService.setPrivateKey(Utils.loadPrivateKey(privateKeyBytes));
                pushService.setSubject(vapidKeysConfig.getSubject());
            } catch (Exception e) {
                log.error("Lazy initialization of PushService VAPID credentials failed", e);
                return;
            }
        }

        log.info("Sending Web Push notification to user: {} ({} active subscriptions)", user.getUsername(), subs.size());

        // Build Payload Map
        Map<String, Object> payloadMap = new HashMap<>();
        payloadMap.put("title", title);
        payloadMap.put("body", content);
        payloadMap.put("type", type);
        payloadMap.put("icon", "/logo.ico");
        payloadMap.put("badge", "/favicon.svg");
        
        // Define redirect URL based on notification type
        String redirectUrl = "/";
        if (type != null) {
            switch (type) {
                case "CHAT_MESSAGE":
                    redirectUrl = user.getRole().name().equals("LANDLORD") ? "/landlord/chat" : "/tenant/chat";
                    break;
                case "INVOICE_NEW":
                case "PAYMENT_CONFIRMED":
                case "PAYMENT_REMINDER":
                case "PAYMENT_REPORTED":
                    redirectUrl = user.getRole().name().equals("LANDLORD") 
                            ? (referenceId != null ? "/landlord/invoices/detail/" + referenceId : "/landlord/invoices")
                            : (referenceId != null ? "/tenant/invoices/detail/" + referenceId : "/tenant/invoices");
                    break;
                case "CONTRACT_ACTIVE":
                    redirectUrl = user.getRole().name().equals("LANDLORD")
                            ? (referenceId != null ? "/landlord/contracts/detail/" + referenceId : "/landlord/contracts")
                            : (referenceId != null ? "/tenant/contracts/detail/" + referenceId : "/tenant/contracts");
                    break;
                case "SUBSCRIPTION_REQUEST":
                    if (user.getRole().name().equals("ADMIN")) {
                        redirectUrl = "/admin/landlords";
                    }
                    break;
            }
        }
        payloadMap.put("url", redirectUrl);

        try {
            String payloadJson = objectMapper.writeValueAsString(payloadMap);
            byte[] payloadBytes = payloadJson.getBytes("UTF-8");

            for (PushSubscription sub : subs) {
                try {
                    byte[] publicKeyBytes = Base64.getUrlDecoder().decode(sub.getP256dh());
                    byte[] authBytes = Base64.getUrlDecoder().decode(sub.getAuth());

                    ECPublicKey userPublicKey = (ECPublicKey) Utils.loadPublicKey(publicKeyBytes);

                    Notification notification = new Notification(
                            sub.getEndpoint(),
                            userPublicKey,
                            authBytes,
                            payloadBytes
                    );

                    HttpResponse response = pushService.send(notification);
                    int statusCode = response.getStatusLine().getStatusCode();

                    if (statusCode == 201) {
                        log.debug("Successfully pushed notification to subscription endpoint: {}", sub.getEndpoint());
                    } else if (statusCode == 410 || statusCode == 404) {
                        log.warn("Subscription endpoint is gone or not found. Removing subscription: {}", sub.getEndpoint());
                        pushSubscriptionRepository.delete(sub);
                    } else {
                        log.warn("Failed to push notification to subscription endpoint: {}. Status code: {}", sub.getEndpoint(), statusCode);
                    }
                } catch (Exception e) {
                    log.error("Error sending push to subscription: {}", sub.getEndpoint(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to serialize push notification payload for user: {}", user.getUsername(), e);
        }
    }
}
