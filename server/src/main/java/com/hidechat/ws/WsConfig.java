package com.hidechat.ws;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WsConfig implements WebSocketConfigurer {
    private final ChatWsHandler handler;

    public WsConfig(ChatWsHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 认证在首帧内联完成（设计 6.1），这里放开 origin 限制由业务层保证安全
        registry.addHandler(handler, "/ws").setAllowedOriginPatterns("*");
    }
}
