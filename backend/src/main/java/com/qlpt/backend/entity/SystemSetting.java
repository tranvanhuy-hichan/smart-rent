package com.qlpt.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    private Long id; // We will use a fixed ID = 1 for the single system setting record

    private String phone;
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "payos_client_id")
    private String payosClientId;

    @Column(name = "payos_api_key")
    private String payosApiKey;

    @Column(name = "payos_checksum_key")
    private String payosChecksumKey;
}
