package com.hidechat.modules.message.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarkMessageReadRequest {

    @NotBlank
    private String conversationId;

    private List<String> messageIds;
}
