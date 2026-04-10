package com.hidechat.modules.contact.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecentContactItemVO {

    private String peerUid;
    private String displayUserId;
    private String peerNickname;
    private String peerAvatar;
    private Long createdAt;
}
