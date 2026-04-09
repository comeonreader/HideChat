package com.hidechat.modules.message.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {

    private String messageId;

    @NotBlank
    private String conversationId;

    @NotBlank
    private String receiverUid;

    @NotBlank
    private String messageType;

    @NotBlank
    private String payloadType;

    private String payload;

    private String fileId;

    private Long clientMsgTime;
}
