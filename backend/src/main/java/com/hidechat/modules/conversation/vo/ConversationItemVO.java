package com.hidechat.modules.conversation.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConversationItemVO {

    private String conversationId;
    private String peerUid;
    private String peerNickname;
    private String peerAvatar;
    private String remarkName;
    private String lastMessagePreview;
    private String lastMessageType;
    private Long lastMessageAt;
    private Integer unreadCount;
    private Boolean pinned;
}
