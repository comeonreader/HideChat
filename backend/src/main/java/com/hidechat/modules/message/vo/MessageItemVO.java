package com.hidechat.modules.message.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageItemVO {

    private String messageId;
    private String conversationId;
    private String senderUid;
    private String receiverUid;
    private String messageType;
    private String payloadType;
    private String payload;
    private String fileId;
    private Long clientMsgTime;
    private Long serverMsgTime;
    private String serverStatus;
}
