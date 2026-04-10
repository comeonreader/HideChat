package com.hidechat.modules.contact.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ContactItemVO {

    private String peerUid;
    private String displayUserId;
    private String peerNickname;
    private String peerAvatar;
    private String remarkName;
    private Boolean pinned;
    private Long lastMessageAt;
}
