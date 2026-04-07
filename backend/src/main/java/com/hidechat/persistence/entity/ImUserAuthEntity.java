package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_user_auth")
public class ImUserAuthEntity extends BaseIdEntity {

    private String userUid;
    private String authType;
    private String authIdentifier;
    private String credentialHash;
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
