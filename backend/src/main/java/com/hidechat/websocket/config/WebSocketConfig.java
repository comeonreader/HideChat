package com.hidechat.websocket.config;

import com.hidechat.security.SecurityWebProperties;
import com.hidechat.websocket.handler.ChatWebSocketHandler;
import com.hidechat.websocket.security.JwtHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final SecurityWebProperties securityWebProperties;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler,
                           JwtHandshakeInterceptor jwtHandshakeInterceptor,
                           SecurityWebProperties securityWebProperties) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
        this.securityWebProperties = securityWebProperties;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
            .addInterceptors(jwtHandshakeInterceptor)
            .setAllowedOrigins(securityWebProperties.getAllowedOrigins().toArray(String[]::new));
    }
}
