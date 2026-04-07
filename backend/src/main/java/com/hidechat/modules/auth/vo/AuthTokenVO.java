package com.hidechat.modules.auth.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthTokenVO {

    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private AuthUserInfoVO userInfo;
}
