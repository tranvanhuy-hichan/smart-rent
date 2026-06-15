package com.qlpt.backend.service.impl;

import com.qlpt.backend.service.SystemSettingService;

import com.qlpt.backend.entity.SystemSetting;
import com.qlpt.backend.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingServiceImpl(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @PostConstruct
    @Override
    public void init() {
        // Automatically check and seed database on application startup
        getSetting();
    }

    @Transactional
    @Override
    public SystemSetting getSetting() {
        return systemSettingRepository.findById(1L).orElseGet(() -> {
            SystemSetting defaultSetting = SystemSetting.builder()
                    .id(1L)
                    .phone("0365943254")
                    .email("admin@gmail.com")
                    .fullName("Trần Văn Huy")
                    .payosClientId("")
                    .payosApiKey("")
                    .payosChecksumKey("")
                    .build();
            return systemSettingRepository.save(defaultSetting);
        });
    }

    @Transactional
    @Override
    public SystemSetting updateSetting(SystemSetting newSetting) {
        SystemSetting existing = getSetting();
        existing.setPhone(newSetting.getPhone());
        existing.setEmail(newSetting.getEmail());
        existing.setFullName(newSetting.getFullName());
        existing.setPayosClientId(newSetting.getPayosClientId());
        if (newSetting.getPayosApiKey() != null && !newSetting.getPayosApiKey().trim().isEmpty() && !newSetting.getPayosApiKey().equals("******")) {
            existing.setPayosApiKey(newSetting.getPayosApiKey().trim());
        }
        if (newSetting.getPayosChecksumKey() != null && !newSetting.getPayosChecksumKey().trim().isEmpty() && !newSetting.getPayosChecksumKey().equals("******")) {
            existing.setPayosChecksumKey(newSetting.getPayosChecksumKey().trim());
        }
        return systemSettingRepository.save(existing);
    }
}
