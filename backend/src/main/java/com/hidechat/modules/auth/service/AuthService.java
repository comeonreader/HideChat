package com.hidechat.modules.auth.service;

import com.hidechat.modules.auth.dto.EmailCodeLoginRequest;
import com.hidechat.modules.auth.dto.EmailPasswordLoginRequest;
import com.hidechat.modules.auth.dto.EmailRegisterRequest;
import com.hidechat.modules.auth.dto.RefreshTokenRequest;
import com.hidechat.modules.auth.dto.ResetPasswordRequest;
import com.hidechat.modules.auth.dto.SendEmailCodeRequest;
import com.hidechat.modules.auth.vo.AuthTokenVO;
import com.hidechat.modules.auth.vo.RegisterUserVO;

public interface AuthService {

    void sendEmailCode(SendEmailCodeRequest request);

    RegisterUserVO registerByEmail(EmailRegisterRequest request);

    AuthTokenVO loginByEmailPassword(EmailPasswordLoginRequest request);

    AuthTokenVO loginByEmailCode(EmailCodeLoginRequest request);

    void resetPassword(ResetPasswordRequest request);

    AuthTokenVO refreshToken(RefreshTokenRequest request);

    void logout(String currentUserUid, RefreshTokenRequest request);
}
