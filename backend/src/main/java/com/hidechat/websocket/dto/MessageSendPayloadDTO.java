package com.hidechat.websocket.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageSendPayloadDTO {

    private String clientMessageId;
    private String conversationId;
    private String receiverUid;
    private String messageType;
    private String payloadType;
    private String payload;
    private String fileId;
    private Long clientMsgTime;
}
