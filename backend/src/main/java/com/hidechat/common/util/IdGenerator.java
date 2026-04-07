package com.hidechat.common.util;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class IdGenerator {

    private static final int COUNTER_MASK = 0xFFF;
    private final AtomicInteger counter = new AtomicInteger();

    public long nextId() {
        long millis = Instant.now().toEpochMilli();
        int sequence = counter.updateAndGet(current -> (current + 1) & COUNTER_MASK);
        return (millis << 12) | sequence;
    }
}
