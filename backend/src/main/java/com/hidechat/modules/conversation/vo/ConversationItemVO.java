package com.hidechat.modules.conversation.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConversationItemVO {

    private String conversationId;
    private String peerUid;
    private String displayUserId;
    private String peerNickname;
    private String peerAvatar;
    private String remarkName;
    private String previewStrategy;
    private String lastMessagePreview;
    private String lastMessageType;
    private Long lastMessageAt;
    private Integer unreadCount;
    private Boolean pinned;
    private String onlineStatus;
    private String onlineStatusText;
}
