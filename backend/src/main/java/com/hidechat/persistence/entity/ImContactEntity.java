package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_contact")
public class ImContactEntity extends BaseIdEntity {

    private String ownerUid;
    private String peerUid;
    private String remarkName;
    private Boolean pinned;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
