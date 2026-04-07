package com.hidechat.modules.message.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarkMessageReadRequest {

    private String conversationId;
    private List<String> messageIds;
}
