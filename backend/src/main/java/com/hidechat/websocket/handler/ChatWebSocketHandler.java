package com.hidechat.websocket.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        // WebSocket routing will be implemented in later phases.
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // Session cleanup will be implemented in later phases.
    }
}
