package com.hidechat.modules.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.auth.dto.EmailCodeLoginRequest;
import com.hidechat.modules.auth.dto.EmailPasswordLoginRequest;
import com.hidechat.modules.auth.dto.EmailRegisterRequest;
import com.hidechat.modules.auth.dto.RefreshTokenRequest;
import com.hidechat.modules.auth.dto.ResetPasswordRequest;
import com.hidechat.modules.auth.dto.SendEmailCodeRequest;
import com.hidechat.modules.auth.service.EmailCodeSender;
import com.hidechat.modules.auth.service.impl.AuthServiceImpl;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;
import com.hidechat.persistence.entity.ImEmailCodeEntity;
import com.hidechat.persistence.entity.ImRefreshTokenEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImEmailCodeMapper;
import com.hidechat.persistence.mapper.ImRefreshTokenMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import com.hidechat.security.jwt.JwtProperties;
import com.hidechat.security.jwt.JwtTokenProvider;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private ImUserMapper userMapper;

    @Mock
    private ImUserAuthMapper userAuthMapper;

    @Mock
    private ImEmailCodeMapper emailCodeMapper;

    @Mock
    private ImRefreshTokenMapper refreshTokenMapper;

    @Mock
    private EmailCodeSender emailCodeSender;

    private PasswordEncoder passwordEncoder;
    private Clock clock;
    private JwtTokenProvider jwtTokenProvider;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        clock = Clock.fixed(Instant.parse("2026-04-07T00:00:00Z"), ZoneOffset.UTC);

        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setIssuer("hidechat");
        jwtProperties.setSecret("hidechat-dev-secret-key-hidechat-dev-secret-key-2026");
        jwtProperties.setAccessTokenExpireSeconds(7200L);
        jwtProperties.setRefreshTokenExpireSeconds(604800L);
        jwtTokenProvider = new JwtTokenProvider(jwtProperties, clock);

        authService = new AuthServiceImpl(
            userMapper,
            userAuthMapper,
            emailCodeMapper,
            refreshTokenMapper,
            passwordEncoder,
            emailCodeSender,
            jwtTokenProvider,
            new IdGenerator(),
            new RandomValueGenerator(),
            clock
        );
    }

    @Test
    void shouldSendEmailCodeSuccessfully() {
        SendEmailCodeRequest request = new SendEmailCodeRequest();
        request.setEmail("alice@example.com");
        request.setBizType(AuthConstants.BIZ_TYPE_REGISTER);

        when(userAuthMapper.selectOne(any())).thenReturn(null);
        when(emailCodeMapper.selectOne(any())).thenReturn(null);

        authService.sendEmailCode(request);

        ArgumentCaptor<ImEmailCodeEntity> captor = ArgumentCaptor.forClass(ImEmailCodeEntity.class);
        verify(emailCodeMapper).insert(captor.capture());
        verify(emailCodeSender).send(eq("alice@example.com"), eq(AuthConstants.BIZ_TYPE_REGISTER), any());
        assertEquals("alice@example.com", captor.getValue().getEmail());
        assertFalse(captor.getValue().getUsed());
    }

    @Test
    void shouldRejectTooFrequentEmailCodeSend() {
        SendEmailCodeRequest request = new SendEmailCodeRequest();
        request.setEmail("alice@example.com");
        request.setBizType(AuthConstants.BIZ_TYPE_REGISTER);

        ImEmailCodeEntity latest = new ImEmailCodeEntity();
        latest.setCreatedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).minusSeconds(30));

        when(userAuthMapper.selectOne(any())).thenReturn(null);
        when(emailCodeMapper.selectOne(any())).thenReturn(latest);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.sendEmailCode(request));

        assertEquals(410107, exception.getCode());
        verify(emailCodeMapper, never()).insert(any(ImEmailCodeEntity.class));
    }

    @Test
    void shouldRegisterByEmailSuccessfully() {
        EmailRegisterRequest request = new EmailRegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");
        request.setEmailCode("123456");
        request.setNickname("Alice");

        ImEmailCodeEntity emailCode = buildEmailCode(AuthConstants.BIZ_TYPE_REGISTER, "123456");

        when(userAuthMapper.selectOne(any())).thenReturn(null);
        when(emailCodeMapper.selectOne(any())).thenReturn(emailCode);

        RegisterUserVO response = authService.registerByEmail(request);

        assertNotNull(response.getUserUid());
        verify(userMapper).insert(any(ImUserEntity.class));
        verify(userAuthMapper).insert(any(ImUserAuthEntity.class));
        assertTrue(emailCode.getUsed());
        verify(emailCodeMapper).updateById(emailCode);
    }

    @Test
    void shouldRejectRegisterWithWrongEmailCode() {
        EmailRegisterRequest request = new EmailRegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");
        request.setEmailCode("999999");
        request.setNickname("Alice");

        ImEmailCodeEntity emailCode = buildEmailCode(AuthConstants.BIZ_TYPE_REGISTER, "123456");

        when(userAuthMapper.selectOne(any())).thenReturn(null);
        when(emailCodeMapper.selectOne(any())).thenReturn(emailCode);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.registerByEmail(request));

        assertEquals(410104, exception.getCode());
        verify(userMapper, never()).insert(any(ImUserEntity.class));
        verify(userAuthMapper, never()).insert(any(ImUserAuthEntity.class));
        verify(emailCodeMapper, never()).updateById(any(ImEmailCodeEntity.class));
    }

    @Test
    void shouldRejectRegisterWithExpiredEmailCode() {
        EmailRegisterRequest request = new EmailRegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");
        request.setEmailCode("123456");
        request.setNickname("Alice");

        ImEmailCodeEntity emailCode = buildEmailCode(AuthConstants.BIZ_TYPE_REGISTER, "123456");
        emailCode.setExpireAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).minusMinutes(1));

        when(userAuthMapper.selectOne(any())).thenReturn(null);
        when(emailCodeMapper.selectOne(any())).thenReturn(emailCode);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.registerByEmail(request));

        assertEquals(410105, exception.getCode());
        verify(userMapper, never()).insert(any(ImUserEntity.class));
        verify(userAuthMapper, never()).insert(any(ImUserAuthEntity.class));
        verify(emailCodeMapper, never()).updateById(any(ImEmailCodeEntity.class));
    }

    @Test
    void shouldRejectRegisterWithUsedEmailCode() {
        EmailRegisterRequest request = new EmailRegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");
        request.setEmailCode("123456");
        request.setNickname("Alice");

        ImEmailCodeEntity emailCode = buildEmailCode(AuthConstants.BIZ_TYPE_REGISTER, "123456");
        emailCode.setUsed(Boolean.TRUE);

        when(userAuthMapper.selectOne(any())).thenReturn(null);
        when(emailCodeMapper.selectOne(any())).thenReturn(emailCode);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.registerByEmail(request));

        assertEquals(410106, exception.getCode());
        verify(userMapper, never()).insert(any(ImUserEntity.class));
        verify(userAuthMapper, never()).insert(any(ImUserAuthEntity.class));
        verify(emailCodeMapper, never()).updateById(any(ImEmailCodeEntity.class));
    }

    @Test
    void shouldLoginByPasswordSuccessfully() {
        EmailPasswordLoginRequest request = new EmailPasswordLoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Abcd1234");

        ImUserAuthEntity userAuth = buildUserAuth("u_1001", "alice@example.com", "Abcd1234");
        ImUserEntity user = buildUser("u_1001", "Alice");

        when(userAuthMapper.selectOne(any())).thenReturn(userAuth);
        when(userMapper.selectOne(any())).thenReturn(user);

        AuthTokenVO response = authService.loginByEmailPassword(request);

        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("u_1001", response.getUserInfo().getUserUid());
        verify(refreshTokenMapper).insert(any(ImRefreshTokenEntity.class));
    }

    @Test
    void shouldRejectWrongPasswordLogin() {
        EmailPasswordLoginRequest request = new EmailPasswordLoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("Wrong1234");

        when(userAuthMapper.selectOne(any())).thenReturn(buildUserAuth("u_1001", "alice@example.com", "Abcd1234"));

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.loginByEmailPassword(request));

        assertEquals(410103, exception.getCode());
    }

    @Test
    void shouldLoginByEmailCodeSuccessfully() {
        EmailCodeLoginRequest request = new EmailCodeLoginRequest();
        request.setEmail("alice@example.com");
        request.setEmailCode("123456");

        ImUserAuthEntity userAuth = buildUserAuth("u_1001", "alice@example.com", "Abcd1234");
        ImUserEntity user = buildUser("u_1001", "Alice");
        ImEmailCodeEntity emailCode = buildEmailCode(AuthConstants.BIZ_TYPE_LOGIN, "123456");

        when(userAuthMapper.selectOne(any())).thenReturn(userAuth);
        when(emailCodeMapper.selectOne(any())).thenReturn(emailCode);
        when(userMapper.selectOne(any())).thenReturn(user);

        AuthTokenVO response = authService.loginByEmailCode(request);

        assertEquals("u_1001", response.getUserInfo().getUserUid());
        assertTrue(emailCode.getUsed());
        verify(emailCodeMapper).updateById(emailCode);
    }

    @Test
    void shouldResetPasswordAndRevokeTokens() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("alice@example.com");
        request.setEmailCode("123456");
        request.setNewPassword("NewPass1234");

        ImUserAuthEntity userAuth = buildUserAuth("u_1001", "alice@example.com", "Abcd1234");
        ImEmailCodeEntity emailCode = buildEmailCode(AuthConstants.BIZ_TYPE_RESET_PASSWORD, "123456");

        when(userAuthMapper.selectOne(any())).thenReturn(userAuth);
        when(emailCodeMapper.selectOne(any())).thenReturn(emailCode);

        authService.resetPassword(request);

        assertTrue(passwordEncoder.matches("NewPass1234", userAuth.getCredentialHash()));
        verify(userAuthMapper).updateById(userAuth);
        verify(refreshTokenMapper).update(eq(null), any());
        verify(emailCodeMapper).updateById(emailCode);
    }

    @Test
    void shouldRefreshTokenSuccessfully() {
        ImUserEntity user = buildUser("u_1001", "Alice");
        String refreshToken = jwtTokenProvider.createRefreshToken("u_1001", "token-1");

        ImRefreshTokenEntity tokenEntity = new ImRefreshTokenEntity();
        tokenEntity.setUserUid("u_1001");
        tokenEntity.setTokenId("token-1");
        tokenEntity.setExpireAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).plusDays(1));
        tokenEntity.setRevoked(Boolean.FALSE);

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(refreshToken);

        when(refreshTokenMapper.selectOne(any())).thenReturn(tokenEntity);
        when(userMapper.selectOne(any())).thenReturn(user);

        AuthTokenVO response = authService.refreshToken(request);

        assertNotNull(response.getAccessToken());
        assertTrue(tokenEntity.getRevoked());
        verify(refreshTokenMapper).updateById(tokenEntity);
        verify(refreshTokenMapper).insert(any(ImRefreshTokenEntity.class));
    }

    @Test
    void shouldRejectInvalidRefreshToken() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("invalid-token");

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.refreshToken(request));

        assertEquals(410108, exception.getCode());
    }

    @Test
    void shouldLogoutSuccessfully() {
        String refreshToken = jwtTokenProvider.createRefreshToken("u_1001", "token-1");
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(refreshToken);

        ImRefreshTokenEntity tokenEntity = new ImRefreshTokenEntity();
        tokenEntity.setUserUid("u_1001");
        tokenEntity.setTokenId("token-1");
        tokenEntity.setRevoked(Boolean.FALSE);

        when(refreshTokenMapper.selectOne(any())).thenReturn(tokenEntity);

        authService.logout("u_1001", request);

        assertTrue(tokenEntity.getRevoked());
        verify(refreshTokenMapper).updateById(tokenEntity);
    }

    private ImEmailCodeEntity buildEmailCode(String bizType, String rawCode) {
        ImEmailCodeEntity entity = new ImEmailCodeEntity();
        entity.setEmail("alice@example.com");
        entity.setBizType(bizType);
        entity.setCodeHash(passwordEncoder.encode(rawCode));
        entity.setExpireAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).plusMinutes(10));
        entity.setUsed(Boolean.FALSE);
        entity.setCreatedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).minusMinutes(1));
        return entity;
    }

    private ImUserAuthEntity buildUserAuth(String userUid, String email, String rawPassword) {
        ImUserAuthEntity entity = new ImUserAuthEntity();
        entity.setUserUid(userUid);
        entity.setAuthType(AuthConstants.AUTH_TYPE_EMAIL_PASSWORD);
        entity.setAuthIdentifier(email);
        entity.setCredentialHash(passwordEncoder.encode(rawPassword));
        entity.setVerified(Boolean.TRUE);
        return entity;
    }

    private ImUserEntity buildUser(String userUid, String nickname) {
        ImUserEntity entity = new ImUserEntity();
        entity.setUserUid(userUid);
        entity.setNickname(nickname);
        entity.setAvatarUrl("");
        entity.setStatus(AuthConstants.USER_STATUS_NORMAL);
        return entity;
    }
}
