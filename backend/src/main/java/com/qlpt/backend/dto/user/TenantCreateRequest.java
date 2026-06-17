package com.qlpt.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TenantCreateRequest {
    private String username;

    private String password;

    private String email;
    private String phone;

    @NotBlank(message = "Họ và tên không được trống")
    private String fullName;

    @NotBlank(message = "Số CMND/CCCD không được trống")
    private String identityCard;
    private java.time.LocalDate idCardIssueDate;
    private String idCardIssuePlace;
    private String permanentAddress;
}
