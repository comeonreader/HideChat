package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_conversation")
public class ImConversationEntity extends BaseIdEntity {

    private String conversationId;
    private String userAUid;
    private String userBUid;
    private String lastMessageId;
    private String lastMessageType;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
