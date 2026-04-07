package com.hidechat.common.util;

import java.security.SecureRandom;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class RandomValueGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String sixDigitCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    public String tokenId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public String userUid() {
        return "u_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public String conversationId() {
        return "c_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
