package com.hidechat.modules.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.hamcrest.Matchers;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.auth.controller.AuthController;
import com.hidechat.modules.auth.dto.EmailCodeLoginRequest;
import com.hidechat.modules.auth.dto.EmailPasswordLoginRequest;
import com.hidechat.modules.auth.dto.EmailRegisterRequest;
import com.hidechat.modules.auth.dto.RefreshTokenRequest;
import com.hidechat.modules.auth.dto.ResetPasswordRequest;
import com.hidechat.modules.auth.dto.SendEmailCodeRequest;
import com.hidechat.modules.auth.service.AuthService;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.AuthUserInfoVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldSendEmailCode() throws Exception {
        SendEmailCodeRequest request = new SendEmailCodeRequest();
        request.setEmail("alice@example.com");
        request.setBizType("register");
        doNothing().when(authService).sendEmailCode(any(SendEmailCodeRequest.class));

        mockMvc.perform(post("/api/auth/email/send-code")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.message").value("success"))
            .andExpect(jsonPath("$.data").value(Matchers.nullValue()));
    }

    @Test
    void shouldRegisterByEmail() throws Exception {
        EmailRegisterRequest request = new EmailRegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");
        request.setEmailCode("123456");
        request.setNickname("Alice");
        when(authService.registerByEmail(any(EmailRegisterRequest.class))).thenReturn(new RegisterUserVO("u_1001"));

        mockMvc.perform(post("/api/auth/email/register")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.userUid").value("u_1001"));
    }

    @Test
    void shouldLoginByPassword() throws Exception {
        EmailPasswordLoginRequest request = new EmailPasswordLoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");
        when(authService.loginByEmailPassword(any(EmailPasswordLoginRequest.class))).thenReturn(buildTokenVo());

        mockMvc.perform(post("/api/auth/email/password-login")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").value("access-token"))
            .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"))
            .andExpect(jsonPath("$.data.userInfo.userUid").value("u_1001"));
    }

    @Test
    void shouldLoginByCode() throws Exception {
        EmailCodeLoginRequest request = new EmailCodeLoginRequest();
        request.setEmail("alice@example.com");
        request.setEmailCode("123456");
        when(authService.loginByEmailCode(any(EmailCodeLoginRequest.class))).thenReturn(buildTokenVo());

        mockMvc.perform(post("/api/auth/email/code-login")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").value("access-token"));
    }

    @Test
    void shouldResetPassword() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("alice@example.com");
        request.setEmailCode("123456");
        request.setNewPassword("NewPass1234");
        doNothing().when(authService).resetPassword(any(ResetPasswordRequest.class));

        mockMvc.perform(post("/api/auth/email/reset-password")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldRefreshToken() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-token");
        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(buildTokenVo());

        mockMvc.perform(post("/api/auth/refresh-token")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"));
    }

    @Test
    void shouldLogout() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-token");
        doNothing().when(authService).logout(any(), any(RefreshTokenRequest.class));

        mockMvc.perform(post("/api/auth/logout")
                .principal(() -> "u_1001")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    private AuthTokenVO buildTokenVo() {
        AuthUserInfoVO userInfoVO = new AuthUserInfoVO();
        userInfoVO.setUserUid("u_1001");
        userInfoVO.setNickname("Alice");
        userInfoVO.setAvatarUrl("");

        AuthTokenVO vo = new AuthTokenVO();
        vo.setAccessToken("access-token");
        vo.setRefreshToken("refresh-token");
        vo.setExpiresIn(7200L);
        vo.setUserInfo(userInfoVO);
        return vo;
    }
}
