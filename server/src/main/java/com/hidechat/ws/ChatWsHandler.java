package com.hidechat.ws;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.chat.ChatService;
import com.hidechat.config.AppConfig;
import com.hidechat.error.ApiException;
import com.hidechat.security.JwtService;
import com.hidechat.user.User;
import com.hidechat.user.UserDto;
import com.hidechat.user.UserRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/** WS 入口：首帧 auth 认证（5s 时限）→ 心跳 → 业务帧（设计文档 6 节） */
@Component
public class ChatWsHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(ChatWsHandler.class);
    static final String ATTR_USER = "hc.uid";
    static final String ATTR_AUTHED_AT = "hc.authedAt";

    private final ObjectMapper om = new ObjectMapper();
    private final JwtService jwt;
    private final UserRepository users;
    private final AppConfig cfg;
    private final SessionRegistry registry;
    private final ChatService chat;
    private final Set<WebSocketSession> pending = new CopyOnWriteArraySet<>();

    public ChatWsHandler(JwtService jwt, UserRepository users, AppConfig cfg, SessionRegistry registry,
                         ChatService chat) {
        this.jwt = jwt;
        this.users = users;
        this.cfg = cfg;
        this.registry = registry;
        this.chat = chat;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        pending.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        JsonNode root;
        try {
            root = om.readTree(message.getPayload());
        } catch (Exception e) {
            error(session, "BAD_FRAME", "无法解析的消息帧");
            return;
        }
        String type = root.path("type").asText("");
        boolean authed = session.getAttributes().get(ATTR_USER) != null;
        if (!authed && !"auth".equals(type)) {
            error(session, "UNAUTHENTICATED", "请先完成认证（auth 帧）");
            return;
        }
        try {
            switch (type) {
                case "auth" -> handleAuth(session, root.path("token").asText(""));
                case "ping" -> send(session, Map.of("type", "pong"));
                case "send" -> {
                    long uid = authedUid(session);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> frame = om.convertValue(root, Map.class);
                    chat.send(uid, frame);
                }
                case "read_conv" -> {
                    long uid = authedUid(session);
                    chat.read(uid, root.path("conv_id").asLong());
                }
                case "recall" -> {
                    long uid = authedUid(session);
                    chat.recall(uid, root.path("msg_id").asLong());
                }
                case "typing" -> { /* 二期 */ }
                default -> error(session, "UNKNOWN_TYPE", "未知消息类型: " + type);
            }
        } catch (ApiException e) {
            error(session, e.getCode(), e.getMessage());
        } catch (Exception e) {
            log.warn("ws frame error", e);
            error(session, "INTERNAL", "处理失败");
        }
    }

    private void handleAuth(WebSocketSession session, String token) {
        pending.remove(session);
        if (token.isEmpty()) {
            error(session, "BAD_TOKEN", "缺少 token");
            close(session, 4401, "unauthorized");
            return;
        }
        Claims claims;
        try {
            claims = jwt.parse(token);
        } catch (Exception e) {
            error(session, "BAD_TOKEN", "凭证无效");
            close(session, 4401, "unauthorized");
            return;
        }
        long uid = Long.parseLong(claims.getSubject());
        User u = users.findById(uid).orElse(null);
        if (u == null || claims.get("tv", Integer.class) != u.getTokenVersion()) {
            error(session, "BAD_TOKEN", "凭证已失效");
            close(session, 4401, "unauthorized");
            return;
        }
        session.getAttributes().put(ATTR_USER, uid);
        session.getAttributes().put(ATTR_AUTHED_AT, System.currentTimeMillis());
        registry.add(uid, session);
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("type", "auth_ok");
        ok.put("server_time_ms", Instant.now().toEpochMilli());
        ok.put("user", UserDto.of(u));
        send(session, ok);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        pending.remove(session);
        Object uid = session.getAttributes().get(ATTR_USER);
        if (uid instanceof Long id) {
            registry.remove(session);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        pending.remove(session);
        Object uid = session.getAttributes().get(ATTR_USER);
        if (uid instanceof Long) {
            registry.remove(session);
        }
    }

    /** 每 15s：清理未认证超时（5s）与已断开的会话 */
    @Scheduled(fixedDelay = 15_000)
    public void sweepDeadSessions() {
        long now = System.currentTimeMillis();
        for (WebSocketSession s : pending) {
            if (!s.isOpen() || now - (Long) s.getAttributes().getOrDefault(ATTR_AUTHED_AT, 0L) > 5_000) {
                pending.remove(s);
                try { s.close(new CloseStatus(4401, "auth timeout")); } catch (IOException ignored) { }
            }
        }
    }

    private long authedUid(WebSocketSession session) {
        Object v = session.getAttributes().get(ATTR_USER);
        if (v instanceof Long id) {
            return id;
        }
        throw ApiException.unauthorized("UNAUTHENTICATED", "请先完成认证");
    }

    private void send(WebSocketSession s, Map<String, Object> payload) {
        registry.send(s, payload);
    }

    private void error(WebSocketSession s, String code, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "error");
        m.put("code", code);
        m.put("message", message);
        send(s, m);
    }

    private void close(WebSocketSession s, int code, String reason) {
        try { s.close(new CloseStatus(code, reason)); } catch (IOException ignored) { }
    }
}