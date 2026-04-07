package com.hidechat.modules.file.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompleteFileUploadRequest {

    private String fileId;
    private String storageKey;
    private Long fileSize;
}
