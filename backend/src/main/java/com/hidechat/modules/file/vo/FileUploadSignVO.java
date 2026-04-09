package com.hidechat.modules.file.vo;

import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FileUploadSignVO {

    private String fileId;
    private String uploadUrl;
    private String storageKey;
    private Map<String, String> headers;
}
