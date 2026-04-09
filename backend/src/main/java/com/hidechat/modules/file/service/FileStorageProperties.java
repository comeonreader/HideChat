package com.hidechat.modules.file.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hidechat.file")
public class FileStorageProperties {

    private String storageRoot = "./storage/uploads";
    private long maxFileSizeBytes = 10 * 1024 * 1024;
    private long signedUrlExpireSeconds = 2_592_000;
    private String urlSignatureSecret = "hidechat-file-url-secret-change-me";

    public String getStorageRoot() {
        return storageRoot;
    }

    public void setStorageRoot(String storageRoot) {
        this.storageRoot = storageRoot;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public long getSignedUrlExpireSeconds() {
        return signedUrlExpireSeconds;
    }

    public void setSignedUrlExpireSeconds(long signedUrlExpireSeconds) {
        this.signedUrlExpireSeconds = signedUrlExpireSeconds;
    }

    public String getUrlSignatureSecret() {
        return urlSignatureSecret;
    }

    public void setUrlSignatureSecret(String urlSignatureSecret) {
        this.urlSignatureSecret = urlSignatureSecret;
    }
}
