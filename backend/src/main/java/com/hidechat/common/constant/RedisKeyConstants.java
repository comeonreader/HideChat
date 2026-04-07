package com.hidechat.common.constant;

public final class RedisKeyConstants {

    private RedisKeyConstants() {
    }

    public static String userProfileKey(String userUid) {
        return "user:profile:" + userUid;
    }
}
