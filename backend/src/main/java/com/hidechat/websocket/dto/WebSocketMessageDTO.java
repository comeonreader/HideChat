package com.hidechat.websocket.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebSocketMessageDTO {

    private String type;
    private String conversationId;
    private String payload;
}
