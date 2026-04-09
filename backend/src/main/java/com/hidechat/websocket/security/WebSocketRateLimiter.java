package com.hidechat.websocket.security;

import com.hidechat.security.SecurityWebProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class WebSocketRateLimiter {

    private final SecurityWebProperties securityWebProperties;
    private final Clock clock;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public WebSocketRateLimiter(SecurityWebProperties securityWebProperties, Clock clock) {
        this.securityWebProperties = securityWebProperties;
        this.clock = clock;
    }

    public boolean allow(String userUid) {
        long currentWindow = Instant.now(clock).getEpochSecond() / 60;
        WindowCounter counter = counters.compute(userUid, (unused, existing) -> {
            if (existing == null || existing.windowEpochMinute != currentWindow) {
                return new WindowCounter(currentWindow, 1);
            }
            existing.count++;
            return existing;
        });
        return counter.count <= securityWebProperties.getWebsocketMessagesPerMinute();
    }

    private static final class WindowCounter {
        private final long windowEpochMinute;
        private int count;

        private WindowCounter(long windowEpochMinute, int count) {
            this.windowEpochMinute = windowEpochMinute;
            this.count = count;
        }
    }
}
