package com.qlpt.backend.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Utils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.security.KeyPair;
import java.security.Security;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.util.Base64;

@Configuration
@Getter
@Slf4j
public class VapidKeysConfig {

    @Value("${app.webpush.public-key:}")
    private String publicKey;

    @Value("${app.webpush.private-key:}")
    private String privateKey;

    @Value("${app.webpush.subject:mailto:admin@tranvanhuy.io.vn}")
    private String subject;

    @PostConstruct
    public void init() {
        // Add BouncyCastle provider if not present
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        if (publicKey == null || publicKey.trim().isEmpty() || privateKey == null || privateKey.trim().isEmpty()) {
            log.warn("Web Push VAPID keys are not configured in application properties/environment.");
            log.info("Generating a temporary VAPID Key Pair for this session...");
            try {
                KeyPair keyPair = Utils.generateKeyPair();
                ECPublicKey ecPublicKey = (ECPublicKey) keyPair.getPublic();
                ECPrivateKey ecPrivateKey = (ECPrivateKey) keyPair.getPrivate();

                byte[] publicKeyBytes = Utils.savePublicKey(ecPublicKey);
                byte[] privateKeyBytes = Utils.savePrivateKey(ecPrivateKey);

                this.publicKey = Base64.getUrlEncoder().withoutPadding().encodeToString(publicKeyBytes);
                this.privateKey = Base64.getUrlEncoder().withoutPadding().encodeToString(privateKeyBytes);

                log.info("Temporary VAPID Keys Generated successfully!");
                log.info("VAPID Public Key: {}", this.publicKey);
                log.info("VAPID Private Key: {}", this.privateKey);
                log.info("You can save these in your .env file as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY for persistence.");
            } catch (Exception e) {
                log.error("Failed to generate temporary VAPID keys", e);
            }
        }
    }
}
