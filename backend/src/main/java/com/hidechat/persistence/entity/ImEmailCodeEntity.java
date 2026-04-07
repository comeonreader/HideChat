package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_email_code")
public class ImEmailCodeEntity extends BaseIdEntity {

    private String email;
    private String bizType;
    private String codeHash;
    private LocalDateTime expireAt;
    private Boolean used;
    private Integer sendCount;
    private LocalDateTime createdAt;
}
