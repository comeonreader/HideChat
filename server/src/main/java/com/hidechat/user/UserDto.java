package com.hidechat.user;

/** 对外用户视图（加好友前即可见：用户名/昵称/头像版本） */
public record UserDto(Long id, String username, String nickname, String avatarExt, int avatarVersion) {
    public static UserDto of(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getNickname(), u.getAvatarExt(), u.getAvatarVersion());
    }
}
