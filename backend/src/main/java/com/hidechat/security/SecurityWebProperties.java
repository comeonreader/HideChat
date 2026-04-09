package com.hidechat.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hidechat.security.web")
public class SecurityWebProperties {

    private List<String> allowedOrigins = List.of("http://localhost:5173", "http://127.0.0.1:5173");
    private int authRequestsPerMinute = 30;
    private int websocketMessagesPerMinute = 120;
    private String contentSecurityPolicy = "default-src 'self'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:";

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
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
}
