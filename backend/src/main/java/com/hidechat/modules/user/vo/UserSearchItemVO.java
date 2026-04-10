package com.hidechat.modules.user.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSearchItemVO {

    private String userUid;
    private String displayUserId;
    private String nickname;
    private String avatarUrl;
    private String matchType;
    private Boolean alreadyAdded;
}
