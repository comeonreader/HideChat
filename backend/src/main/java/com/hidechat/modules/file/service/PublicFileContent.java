package com.hidechat.modules.file.service;

import org.springframework.core.io.Resource;

public class PublicFileContent {

    private final Resource resource;
    private final String mimeType;

    public PublicFileContent(Resource resource, String mimeType) {
        this.resource = resource;
        this.mimeType = mimeType;
    }

    public Resource getResource() {
        return resource;
    }

    public String getMimeType() {
        return mimeType;
    }
}
