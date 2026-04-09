package com.hidechat.websocket.handler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.websocket.dto.WebSocketMessageDTO;
import com.hidechat.websocket.security.JwtHandshakeInterceptor;
import com.hidechat.websocket.security.WebSocketRateLimiter;
import com.hidechat.websocket.session.WebSocketSessionRegistry;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    private final ImConversationMapper conversationMapper;
    private final WebSocketSessionRegistry sessionRegistry;
    private final WebSocketRateLimiter webSocketRateLimiter;
    private final Clock clock;

    public ChatWebSocketHandler(ObjectMapper objectMapper,
                                MessageService messageService,
                                ImConversationMapper conversationMapper,
                                WebSocketSessionRegistry sessionRegistry,
                                WebSocketRateLimiter webSocketRateLimiter,
                                Clock clock) {
        this.objectMapper = objectMapper;
        this.messageService = messageService;
        this.conversationMapper = conversationMapper;
        this.sessionRegistry = sessionRegistry;
        this.webSocketRateLimiter = webSocketRateLimiter;
        this.clock = clock;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userUid = getUserUid(session);
        if (StringUtils.hasText(userUid)) {
            sessionRegistry.put(userUid, session);
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        WebSocketMessageDTO wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessageDTO.class);
        String userUid = getUserUid(session);
        if ("CHAT_SEND".equals(wsMessage.getType())) {
            handleChatSend(session, userUid, wsMessage);
            return;
        }
        if ("CHAT_READ".equals(wsMessage.getType())) {
            handleChatRead(userUid, wsMessage);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userUid = getUserUid(session);
        if (StringUtils.hasText(userUid)) {
            sessionRegistry.remove(userUid);
        }
    }

    private void handleChatSend(WebSocketSession senderSession,
                                String senderUid,
                                WebSocketMessageDTO wsMessage) throws IOException {
        if (!webSocketRateLimiter.allow(senderUid)) {
            send(senderSession, buildEnvelope("CHAT_ERROR", Map.of("code", 429001, "message", "WebSocket 消息过于频繁")));
            return;
        }
        SendMessageRequest request = objectMapper.treeToValue(wsMessage.getData(), SendMessageRequest.class);
        MessageItemVO sentMessage = messageService.sendMessage(senderUid, request);
        send(senderSession, buildEnvelope("CHAT_ACK", Map.of(
            "messageId", sentMessage.getMessageId(),
            "status", "server_received",
            "message", sentMessage
        )));
        WebSocketSession receiverSession = sessionRegistry.get(sentMessage.getReceiverUid());
        if (receiverSession != null && receiverSession.isOpen()) {
            send(receiverSession, buildEnvelope("CHAT_RECEIVE", sentMessage));
        }
    }

    private void handleChatRead(String readerUid, WebSocketMessageDTO wsMessage) throws IOException {
        MarkMessageReadRequest request = objectMapper.treeToValue(wsMessage.getData(), MarkMessageReadRequest.class);
        messageService.markMessagesRead(readerUid, request);
        String peerUid = resolvePeerUid(request.getConversationId(), readerUid);
        if (!StringUtils.hasText(peerUid)) {
            return;
        }
        WebSocketSession peerSession = sessionRegistry.get(peerUid);
        if (peerSession != null && peerSession.isOpen()) {
            send(peerSession, buildEnvelope("CHAT_READ", Map.of(
                "conversationId", request.getConversationId(),
                "messageIds", request.getMessageIds() == null ? List.of() : request.getMessageIds(),
                "readerUid", readerUid,
                "readAt", Instant.now(clock).toEpochMilli()
            )));
        }
    }

    private String resolvePeerUid(String conversationId, String userUid) {
        ImConversationEntity conversation = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getConversationId, conversationId));
        if (conversation == null) {
            return null;
        }
        if (Objects.equals(conversation.getUserAUid(), userUid)) {
            return conversation.getUserBUid();
        }
        if (Objects.equals(conversation.getUserBUid(), userUid)) {
            return conversation.getUserAUid();
        }
        return null;
    }

    private String buildEnvelope(String type, Object data) throws JsonProcessingException {
        return objectMapper.writeValueAsString(Map.of("type", type, "data", data));
    }

    private void send(WebSocketSession session, String payload) throws IOException {
        session.sendMessage(new TextMessage(payload));
    }

    private String getUserUid(WebSocketSession session) {
        Object userUid = session.getAttributes().get(JwtHandshakeInterceptor.ATTR_USER_UID);
        return userUid == null ? null : userUid.toString();
    }
}
