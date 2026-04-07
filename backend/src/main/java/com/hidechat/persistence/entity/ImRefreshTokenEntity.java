package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_refresh_token")
public class ImRefreshTokenEntity extends BaseIdEntity {

    private String userUid;
    private String tokenId;
    private LocalDateTime expireAt;
    private Boolean revoked;
    private LocalDateTime createdAt;
}
