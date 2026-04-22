package com.hidechat.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "hidechat.security.web")
public class SecurityWebProperties {

    private List<String> allowedOrigins = List.of("http://localhost:5173", "http://127.0.0.1:5173");
    private List<String> allowedOriginPatterns = List.of(
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://192.168.*:*",
        "http://10.*:*",
        "http://172.16.*:*",
        "http://172.17.*:*",
        "http://172.18.*:*",
        "http://172.19.*:*",
        "http://172.20.*:*",
        "http://172.21.*:*",
        "http://172.22.*:*",
        "http://172.23.*:*",
        "http://172.24.*:*",
        "http://172.25.*:*",
        "http://172.26.*:*",
        "http://172.27.*:*",
        "http://172.28.*:*",
        "http://172.29.*:*",
        "http://172.30.*:*",
        "http://172.31.*:*"
    );
    private int authRequestsPerMinute = 30;
    private int websocketMessagesPerMinute = 120;
    private String contentSecurityPolicy = "default-src 'self'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:";

    public List<String> getAllowedOrigins() {
        return sanitize(allowedOrigins);
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public List<String> getAllowedOriginPatterns() {
        return sanitize(allowedOriginPatterns);
    }

    public void setAllowedOriginPatterns(List<String> allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns;
    }

    public int getAuthRequestsPerMinute() {
        return authRequestsPerMinute;
    }

    public void setAuthRequestsPerMinute(int authRequestsPerMinute) {
        this.authRequestsPerMinute = authRequestsPerMinute;
    }

    public int getWebsocketMessagesPerMinute() {
        return websocketMessagesPerMinute;
    }

    public void setWebsocketMessagesPerMinute(int websocketMessagesPerMinute) {
        this.websocketMessagesPerMinute = websocketMessagesPerMinute;
    }

    public String getContentSecurityPolicy() {
        return contentSecurityPolicy;
    }

    public void setContentSecurityPolicy(String contentSecurityPolicy) {
        this.contentSecurityPolicy = contentSecurityPolicy;
    }

    private List<String> sanitize(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
            .filter(StringUtils::hasText)
            .toList();
    }
}
