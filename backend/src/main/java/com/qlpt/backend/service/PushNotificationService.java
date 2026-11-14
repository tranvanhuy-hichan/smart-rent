package com.qlpt.backend.service;

import com.qlpt.backend.entity.User;
import java.util.UUID;

public interface PushNotificationService {
    
    void subscribe(User user, String endpoint, String p256dh, String auth);
    
    void unsubscribe(User user, String endpoint);
    
    void sendPushNotification(User user, String title, String content, String type, UUID referenceId);
}
