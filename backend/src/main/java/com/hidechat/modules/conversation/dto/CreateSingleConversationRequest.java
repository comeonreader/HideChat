package com.hidechat.modules.conversation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSingleConversationRequest {

    @NotBlank
    private String peerUid;
}
