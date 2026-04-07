package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_message_read_receipt")
public class ImMessageReadReceiptEntity extends BaseIdEntity {

    private String messageId;
    private String readerUid;
    private LocalDateTime readAt;
}
