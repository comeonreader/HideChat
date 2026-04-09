package com.hidechat.websocket.session;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

@Component
public class WebSocketSessionRegistry {

    private final Map<String, WebSocketSession> sessionByUserUid = new ConcurrentHashMap<>();

    public void put(String userUid, WebSocketSession session) {
        sessionByUserUid.put(userUid, session);
    }

    public WebSocketSession get(String userUid) {
        return sessionByUserUid.get(userUid);
    }

    public void remove(String userUid) {
        sessionByUserUid.remove(userUid);
    }

    public boolean contains(String userUid) {
        return sessionByUserUid.containsKey(userUid);
    }
}
