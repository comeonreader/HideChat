package com.hidechat.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/** 用户 -> 在线 WebSocket 会话（多端） */
@Component
public class SessionRegistry {
    private static final Logger log = LoggerFactory.getLogger(SessionRegistry.class);
    private final Map<Long, Set<WebSocketSession>> byUser = new ConcurrentHashMap<>();
    private final ObjectMapper om = new ObjectMapper();

    public void add(Long userId, WebSocketSession session) {
        byUser.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    public void remove(WebSocketSession session) {
        byUser.forEach((uid, sessions) -> sessions.remove(session));
        byUser.entrySet().removeIf(e -> e.getValue().isEmpty());
    }

    public Set<WebSocketSession> sessionsOf(Long userId) {
        return byUser.getOrDefault(userId, Set.of());
    }

    /** 推给某用户所有在线端；失败(断开)的会话静默移除 */
    public boolean sendToUser(Long userId, Map<String, Object> payload) {
        boolean any = false;
        for (WebSocketSession s : sessionsOf(userId)) {
            if (send(s, payload)) {
                any = true;
            }
        }
        return any;
    }

    public boolean send(WebSocketSession s, Map<String, Object> payload) {
        if (!s.isOpen()) {
            return false;
        }
        try {
            synchronized (s) {
                s.sendMessage(new TextMessage(om.writeValueAsString(payload)));
            }
            return true;
        } catch (IOException e) {
            log.debug("ws send failed: {}", e.getMessage());
            return false;
        }
    }

    /** 下线所有会话（用于改密踢线等） */
    public void dropUser(Long userId) {
        for (WebSocketSession s : sessionsOf(userId)) {
            try { s.close(); } catch (IOException ignored) { }
        }
        byUser.remove(userId);
    }
}
