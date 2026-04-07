package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_message")
public class ImMessageEntity extends BaseIdEntity {

    private String messageId;
    private String conversationId;
    private String senderUid;
    private String receiverUid;
    private String messageType;
    private String payloadType;
    private String payload;
    private String fileId;
    private String serverStatus;
    private Long clientMsgTime;
    private LocalDateTime serverMsgTime;
    private Boolean deleted;
}
