package com.hidechat.common.constant;

public final class AuthConstants {

    public static final String AUTH_TYPE_EMAIL_PASSWORD = "email_password";
    public static final String BIZ_TYPE_REGISTER = "register";
    public static final String BIZ_TYPE_LOGIN = "login";
    public static final String BIZ_TYPE_RESET_PASSWORD = "reset_password";
    public static final short USER_STATUS_NORMAL = 1;
    public static final short USER_STATUS_DISABLED = 0;
    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";

    private AuthConstants() {
    }
}
