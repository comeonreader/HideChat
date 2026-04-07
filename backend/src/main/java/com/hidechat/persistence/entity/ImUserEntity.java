package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_user")
public class ImUserEntity extends BaseIdEntity {

    private String userUid;
    private String nickname;
    private String avatarUrl;
    private Short status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
