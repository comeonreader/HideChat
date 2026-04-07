package com.hidechat.modules.auth.controller;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.auth.dto.EmailCodeLoginRequest;
import com.hidechat.modules.auth.dto.EmailPasswordLoginRequest;
import com.hidechat.modules.auth.dto.EmailRegisterRequest;
import com.hidechat.modules.auth.dto.RefreshTokenRequest;
import com.hidechat.modules.auth.dto.ResetPasswordRequest;
import com.hidechat.modules.auth.dto.SendEmailCodeRequest;
import com.hidechat.modules.auth.service.AuthService;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/email/send-code")
    public ApiResponse<Void> sendEmailCode(@Valid @RequestBody SendEmailCodeRequest request) {
        authService.sendEmailCode(request);
        return ApiResponse.success();
    }

    @PostMapping("/email/register")
    public ApiResponse<RegisterUserVO> register(@Valid @RequestBody EmailRegisterRequest request) {
        return ApiResponse.success(authService.registerByEmail(request));
    }

    @PostMapping("/email/password-login")
    public ApiResponse<AuthTokenVO> passwordLogin(@Valid @RequestBody EmailPasswordLoginRequest request) {
        return ApiResponse.success(authService.loginByEmailPassword(request));
    }

    @PostMapping("/email/code-login")
    public ApiResponse<AuthTokenVO> codeLogin(@Valid @RequestBody EmailCodeLoginRequest request) {
        return ApiResponse.success(authService.loginByEmailCode(request));
    }

    @PostMapping("/email/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success();
    }

    @PostMapping("/refresh-token")
    public ApiResponse<AuthTokenVO> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Principal principal, @Valid @RequestBody RefreshTokenRequest request) {
        if (principal == null) {
            throw new BusinessException(401001, "未登录或 token 无效");
        }
        authService.logout(principal.getName(), request);
        return ApiResponse.success();
    }
}
