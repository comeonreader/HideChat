package com.hidechat.modules.file.service;

import org.springframework.core.io.Resource;

public class PublicFileContent {

    private final Resource resource;
    private final String mimeType;
    private final String fileName;

    public PublicFileContent(Resource resource, String mimeType, String fileName) {
        this.resource = resource;
        this.mimeType = mimeType;
        this.fileName = fileName;
    }

    public Resource getResource() {
        return resource;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getFileName() {
        return fileName;
    }
}
