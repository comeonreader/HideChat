package com.hidechat.websocket.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageAckPayloadDTO {

    private String messageId;
    private String conversationId;
    private String status;
    private Long serverMsgTime;
}
