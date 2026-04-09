package com.hidechat.security.filter;

import com.hidechat.security.SecurityWebProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final SecurityWebProperties securityWebProperties;
    private final Clock clock;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(SecurityWebProperties securityWebProperties, Clock clock) {
        this.securityWebProperties = securityWebProperties;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !path.startsWith("/api/auth/email/")
            && !path.equals("/api/auth/refresh-token");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = request.getRemoteAddr() + ":" + request.getServletPath();
        if (!allowRequest(key)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"code\":429001,\"message\":\"请求过于频繁\",\"data\":null}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean allowRequest(String key) {
        long currentWindow = Instant.now(clock).getEpochSecond() / 60;
        WindowCounter counter = counters.compute(key, (unused, existing) -> {
            if (existing == null || existing.windowEpochMinute != currentWindow) {
                return new WindowCounter(currentWindow, 1);
            }
            existing.count++;
            return existing;
        });
        return counter.count <= securityWebProperties.getAuthRequestsPerMinute();
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
