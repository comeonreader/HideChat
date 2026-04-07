package com.hidechat.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hidechat.common.base.BaseIdEntity;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("im_file")
public class ImFileEntity extends BaseIdEntity {

    private String fileId;
    private String uploaderUid;
    private String fileName;
    private String mimeType;
    private Long fileSize;
    private String storageKey;
    private String accessUrl;
    private Boolean encryptFlag;
    private LocalDateTime createdAt;
}
