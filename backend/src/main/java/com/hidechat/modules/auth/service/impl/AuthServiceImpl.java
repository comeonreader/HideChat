package com.hidechat.modules.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
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
import com.hidechat.modules.auth.service.AuthService;
import com.hidechat.modules.auth.service.EmailCodeSender;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.AuthUserInfoVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;
import com.hidechat.persistence.entity.ImEmailCodeEntity;
import com.hidechat.persistence.entity.ImRefreshTokenEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImEmailCodeMapper;
import com.hidechat.persistence.mapper.ImRefreshTokenMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import com.hidechat.security.jwt.JwtClaims;
import com.hidechat.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final long EMAIL_CODE_EXPIRE_MINUTES = 10L;
    private static final long EMAIL_CODE_RESEND_SECONDS = 60L;

    private final ImUserMapper userMapper;
    private final ImUserAuthMapper userAuthMapper;
    private final ImEmailCodeMapper emailCodeMapper;
    private final ImRefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailCodeSender emailCodeSender;
    private final JwtTokenProvider jwtTokenProvider;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    @Override
    @Transactional
    public void sendEmailCode(SendEmailCodeRequest request) {
        String bizType = normalizeBizType(request.getBizType());
        validateEmailBizAccess(request.getEmail(), bizType);

        ImEmailCodeEntity latest = findLatestEmailCode(request.getEmail(), bizType);
        LocalDateTime now = now();
        // 冷却时间按邮箱 + 业务类型隔离，避免不同链路互相卡住，同时限制同一入口被滥刷。
        if (latest != null && latest.getCreatedAt() != null
            && latest.getCreatedAt().plusSeconds(EMAIL_CODE_RESEND_SECONDS).isAfter(now)) {
            throw new BusinessException(410107, "发送验证码过于频繁");
        }

        String code = randomValueGenerator.sixDigitCode();
        ImEmailCodeEntity entity = new ImEmailCodeEntity();
        entity.setId(idGenerator.nextId());
        entity.setEmail(request.getEmail());
        entity.setBizType(bizType);
        entity.setCodeHash(passwordEncoder.encode(code));
        entity.setExpireAt(now.plusMinutes(EMAIL_CODE_EXPIRE_MINUTES));
        entity.setUsed(Boolean.FALSE);
        entity.setSendCount(latest == null ? 1 : Objects.requireNonNullElse(latest.getSendCount(), 0) + 1);
        entity.setCreatedAt(now);
        emailCodeMapper.insert(entity);

        emailCodeSender.send(request.getEmail(), bizType, code);
    }

    @Override
    @Transactional
    public RegisterUserVO registerByEmail(EmailRegisterRequest request) {
        validatePassword(request.getPassword());
        ensureUserNotRegistered(request.getEmail());

        ImEmailCodeEntity emailCode = verifyEmailCode(request.getEmail(), AuthConstants.BIZ_TYPE_REGISTER, request.getEmailCode());
        String userUid = randomValueGenerator.userUid();
        LocalDateTime now = now();

        ImUserEntity user = new ImUserEntity();
        user.setId(idGenerator.nextId());
        user.setUserUid(userUid);
        user.setNickname(request.getNickname());
        user.setStatus(AuthConstants.USER_STATUS_NORMAL);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);

        ImUserAuthEntity auth = new ImUserAuthEntity();
        auth.setId(idGenerator.nextId());
        auth.setUserUid(userUid);
        auth.setAuthType(AuthConstants.AUTH_TYPE_EMAIL_PASSWORD);
        auth.setAuthIdentifier(request.getEmail());
        auth.setCredentialHash(passwordEncoder.encode(request.getPassword()));
        auth.setVerified(Boolean.TRUE);
        auth.setCreatedAt(now);
        auth.setUpdatedAt(now);
        userAuthMapper.insert(auth);

        markEmailCodeUsed(emailCode);
        return new RegisterUserVO(userUid);
    }

    @Override
    public AuthTokenVO loginByEmailPassword(EmailPasswordLoginRequest request) {
        ImUserAuthEntity userAuth = findEmailPasswordAuth(request.getEmail());
        if (userAuth == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        if (!passwordEncoder.matches(request.getPassword(), userAuth.getCredentialHash())) {
            throw new BusinessException(410103, "密码错误");
        }
        ImUserEntity user = requireActiveUser(userAuth.getUserUid());
        return issueTokens(user);
    }

    @Override
    @Transactional
    public AuthTokenVO loginByEmailCode(EmailCodeLoginRequest request) {
        ImUserAuthEntity userAuth = findEmailPasswordAuth(request.getEmail());
        if (userAuth == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        ImEmailCodeEntity emailCode = verifyEmailCode(request.getEmail(), AuthConstants.BIZ_TYPE_LOGIN, request.getEmailCode());
        ImUserEntity user = requireActiveUser(userAuth.getUserUid());
        markEmailCodeUsed(emailCode);
        return issueTokens(user);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        validatePassword(request.getNewPassword());
        ImUserAuthEntity userAuth = findEmailPasswordAuth(request.getEmail());
        if (userAuth == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        ImEmailCodeEntity emailCode = verifyEmailCode(
            request.getEmail(),
            AuthConstants.BIZ_TYPE_RESET_PASSWORD,
            request.getEmailCode()
        );

        userAuth.setCredentialHash(passwordEncoder.encode(request.getNewPassword()));
        userAuthMapper.updateById(userAuth);
        revokeAllRefreshTokensByUserUid(userAuth.getUserUid());
        markEmailCodeUsed(emailCode);
    }

    @Override
    @Transactional
    public AuthTokenVO refreshToken(RefreshTokenRequest request) {
        JwtClaims claims = parseRefreshToken(request.getRefreshToken());
        ImRefreshTokenEntity tokenEntity = findActiveRefreshToken(claims.tokenId());
        if (tokenEntity == null || tokenEntity.getExpireAt().isBefore(now())) {
            throw new BusinessException(410108, "refresh token 无效");
        }
        ImUserEntity user = requireActiveUser(tokenEntity.getUserUid());

        tokenEntity.setRevoked(Boolean.TRUE);
        refreshTokenMapper.updateById(tokenEntity);
        return issueTokens(user);
    }

    @Override
    @Transactional
    public void logout(String currentUserUid, RefreshTokenRequest request) {
        JwtClaims claims = parseRefreshToken(request.getRefreshToken());
        if (!Objects.equals(currentUserUid, claims.userUid())) {
            throw new BusinessException(403001, "无权限访问");
        }
        ImRefreshTokenEntity tokenEntity = findActiveRefreshToken(claims.tokenId());
        if (tokenEntity == null) {
            throw new BusinessException(410108, "refresh token 无效");
        }
        tokenEntity.setRevoked(Boolean.TRUE);
        refreshTokenMapper.updateById(tokenEntity);
    }

    private void validateEmailBizAccess(String email, String bizType) {
        boolean registered = findEmailPasswordAuth(email) != null;
        if (AuthConstants.BIZ_TYPE_REGISTER.equals(bizType) && registered) {
            throw new BusinessException(410101, "邮箱已注册");
        }
        if (!AuthConstants.BIZ_TYPE_REGISTER.equals(bizType) && !registered) {
            throw new BusinessException(410102, "用户不存在");
        }
    }

    private String normalizeBizType(String bizType) {
        if (AuthConstants.BIZ_TYPE_REGISTER.equals(bizType)
            || AuthConstants.BIZ_TYPE_LOGIN.equals(bizType)
            || AuthConstants.BIZ_TYPE_RESET_PASSWORD.equals(bizType)) {
            return bizType;
        }
        throw new BusinessException(400003, "参数格式非法");
    }

    private void validatePassword(String password) {
        boolean valid = password != null
            && password.length() >= 8
            && password.chars().anyMatch(Character::isLetter)
            && password.chars().anyMatch(Character::isDigit);
        if (!valid) {
            throw new BusinessException(400003, "参数格式非法");
        }
    }

    private void ensureUserNotRegistered(String email) {
        if (findEmailPasswordAuth(email) != null) {
            throw new BusinessException(410101, "邮箱已注册");
        }
    }

    private ImEmailCodeEntity verifyEmailCode(String email, String bizType, String rawCode) {
        ImEmailCodeEntity emailCode = findLatestEmailCode(email, bizType);
        if (emailCode == null) {
            throw new BusinessException(410104, "邮箱验证码无效");
        }
        if (Boolean.TRUE.equals(emailCode.getUsed())) {
            throw new BusinessException(410106, "邮箱验证码已使用");
        }
        if (emailCode.getExpireAt().isBefore(now())) {
            throw new BusinessException(410105, "邮箱验证码已过期");
        }
        if (!passwordEncoder.matches(rawCode, emailCode.getCodeHash())) {
            throw new BusinessException(410104, "邮箱验证码无效");
        }
        return emailCode;
    }

    private void markEmailCodeUsed(ImEmailCodeEntity emailCode) {
        emailCode.setUsed(Boolean.TRUE);
        emailCodeMapper.updateById(emailCode);
    }

    private ImUserAuthEntity findEmailPasswordAuth(String email) {
        return userAuthMapper.selectOne(new LambdaQueryWrapper<ImUserAuthEntity>()
            .eq(ImUserAuthEntity::getAuthType, AuthConstants.AUTH_TYPE_EMAIL_PASSWORD)
            .eq(ImUserAuthEntity::getAuthIdentifier, email)
            .last("limit 1"));
    }

    private ImEmailCodeEntity findLatestEmailCode(String email, String bizType) {
        return emailCodeMapper.selectOne(new LambdaQueryWrapper<ImEmailCodeEntity>()
            .eq(ImEmailCodeEntity::getEmail, email)
            .eq(ImEmailCodeEntity::getBizType, bizType)
            .orderByDesc(ImEmailCodeEntity::getCreatedAt)
            .last("limit 1"));
    }

    private ImRefreshTokenEntity findActiveRefreshToken(String tokenId) {
        return refreshTokenMapper.selectOne(new LambdaQueryWrapper<ImRefreshTokenEntity>()
            .eq(ImRefreshTokenEntity::getTokenId, tokenId)
            .eq(ImRefreshTokenEntity::getRevoked, Boolean.FALSE)
            .last("limit 1"));
    }

    private ImUserEntity requireActiveUser(String userUid) {
        ImUserEntity user = userMapper.selectOne(new LambdaQueryWrapper<ImUserEntity>()
            .eq(ImUserEntity::getUserUid, userUid)
            .last("limit 1"));
        if (user == null) {
            throw new BusinessException(410102, "用户不存在");
        }
        if (Objects.equals(user.getStatus(), AuthConstants.USER_STATUS_DISABLED)) {
            throw new BusinessException(403001, "无权限访问");
        }
        return user;
    }

    private void revokeAllRefreshTokensByUserUid(String userUid) {
        // 重置密码后统一吊销旧 refresh token，避免旧设备继续长期持有会话。
        refreshTokenMapper.update(null, new UpdateWrapper<ImRefreshTokenEntity>()
            .eq("user_uid", userUid)
            .eq("revoked", Boolean.FALSE)
            .set("revoked", Boolean.TRUE));
    }

    private JwtClaims parseRefreshToken(String refreshToken) {
        try {
            JwtClaims claims = jwtTokenProvider.parse(refreshToken);
            if (!AuthConstants.TOKEN_TYPE_REFRESH.equals(claims.tokenType())) {
                throw new BusinessException(410108, "refresh token 无效");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException exception) {
            throw new BusinessException(410108, "refresh token 无效");
        }
    }

    private AuthTokenVO issueTokens(ImUserEntity user) {
        String refreshTokenId = randomValueGenerator.tokenId();
        LocalDateTime now = now();

        // refresh token 必须先落库，后续刷新/登出才能做服务端撤销而不是只依赖 JWT 自身过期。
        ImRefreshTokenEntity refreshTokenEntity = new ImRefreshTokenEntity();
        refreshTokenEntity.setId(idGenerator.nextId());
        refreshTokenEntity.setUserUid(user.getUserUid());
        refreshTokenEntity.setTokenId(refreshTokenId);
        refreshTokenEntity.setExpireAt(now.plusSeconds(jwtTokenProvider.getRefreshTokenExpireSeconds()));
        refreshTokenEntity.setRevoked(Boolean.FALSE);
        refreshTokenEntity.setCreatedAt(now);
        refreshTokenMapper.insert(refreshTokenEntity);

        AuthUserInfoVO userInfoVO = new AuthUserInfoVO();
        userInfoVO.setUserUid(user.getUserUid());
        userInfoVO.setNickname(user.getNickname());
        userInfoVO.setAvatarUrl(user.getAvatarUrl());

        AuthTokenVO vo = new AuthTokenVO();
        vo.setAccessToken(jwtTokenProvider.createAccessToken(user.getUserUid(), randomValueGenerator.tokenId()));
        vo.setRefreshToken(jwtTokenProvider.createRefreshToken(user.getUserUid(), refreshTokenId));
        vo.setExpiresIn(jwtTokenProvider.getAccessTokenExpireSeconds());
        vo.setUserInfo(userInfoVO);
        return vo;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
