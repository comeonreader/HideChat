package com.hidechat.modules.file.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FileInfoVO {

    private String fileId;
    private String fileName;
    private String mimeType;
    private Long fileSize;
    private String accessUrl;
    private Boolean encryptFlag;
}
