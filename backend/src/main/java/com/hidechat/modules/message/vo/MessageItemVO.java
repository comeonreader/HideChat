package com.hidechat.modules.message.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageItemVO {

    private String messageId;
    private String conversationId;
    private String senderUid;
    private String messageType;
}
