package com.hidechat.modules.file.service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class FileUrlSignatureService {

    private final FileStorageProperties fileStorageProperties;
    private final Clock clock;

    public FileUrlSignatureService(FileStorageProperties fileStorageProperties, Clock clock) {
        this.fileStorageProperties = fileStorageProperties;
        this.clock = clock;
    }

    public long buildExpiryEpochSeconds() {
        return Instant.now(clock).plusSeconds(fileStorageProperties.getSignedUrlExpireSeconds()).getEpochSecond();
    }

    public String signDownload(String fileId, long expiresAtEpochSeconds) {
        return sign("download:" + fileId + ":" + expiresAtEpochSeconds);
    }

    public boolean verifyDownload(String fileId, long expiresAtEpochSeconds, String signature) {
        if (expiresAtEpochSeconds <= Instant.now(clock).getEpochSecond()) {
            return false;
        }
        return signDownload(fileId, expiresAtEpochSeconds).equalsIgnoreCase(signature);
    }

    private String sign(String rawValue) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                fileStorageProperties.getUrlSignatureSecret().getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
            ));
            return HexFormat.of().formatHex(mac.doFinal(rawValue.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign file url", exception);
        }
    }
}
