package com.hidechat.modules.file.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompleteFileUploadRequest {

    @NotBlank
    private String fileId;

    @NotBlank
    private String storageKey;

    @NotBlank
    private String mimeType;

    @NotNull
    private Long fileSize;

    @NotNull
    private Boolean encryptFlag;
}
