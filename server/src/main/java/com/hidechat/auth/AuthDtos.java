package com.hidechat.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9_]{3,20}$",
                    message = "用户名须为 3-20 位字母/数字/下划线")
            String username,
            @NotBlank @Size(min = 6, max = 64, message = "密码长度须为 6-64 位")
            String password,
            @Size(max = 30, message = "昵称最长 30 字")
            String nickname) {
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password) {
    }
}
