package com.hidechat.websocket.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RealtimeErrorPayloadDTO {

    private Integer code;
    private String message;
    private Boolean retryable;
}
