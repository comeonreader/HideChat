package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_unread_counter")
public class ImUnreadCounterEntity extends BaseIdEntity {

    private String ownerUid;
    private String conversationId;
    private Integer unreadCount;
    private LocalDateTime updatedAt;
}
