package com.hidechat.websocket.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebSocketMessageDTO {

    private String type;
    private JsonNode data;
}
