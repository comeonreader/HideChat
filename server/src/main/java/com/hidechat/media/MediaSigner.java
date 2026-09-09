package com.hidechat.media;

import com.hidechat.config.AppConfig;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/** 媒体下载签名（设计 8.3：HMAC(key|uid|exp)） */
@Component
public class MediaSigner {
    private final AppConfig cfg;

    public MediaSigner(AppConfig cfg) {
        this.cfg = cfg;
    }

    public String sign(String key, long uid, long expMs) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(cfg.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((key + "|" + uid + "|" + expMs).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public boolean verify(String key, long uid, long expMs, String sig) {
        if (sig == null) return false;
        return MessageDigest.isEqual(sign(key, uid, expMs).getBytes(StandardCharsets.UTF_8),
                sig.getBytes(StandardCharsets.UTF_8));
    }
}
