package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_disguise_lucky_code")
public class ImDisguiseLuckyCodeEntity extends BaseIdEntity {

    private String codeValue;
    private String status;
    private LocalDateTime effectiveStartAt;
    private LocalDateTime effectiveEndAt;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
