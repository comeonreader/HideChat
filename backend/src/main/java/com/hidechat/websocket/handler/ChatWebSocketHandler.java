package com.hidechat.websocket.handler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.modules.message.vo.MessageSyncVO;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.security.jwt.JwtClaims;
import com.hidechat.security.jwt.JwtTokenProvider;
import com.hidechat.websocket.dto.AuthPayloadDTO;
import com.hidechat.websocket.dto.MessageSendPayloadDTO;
import com.hidechat.websocket.dto.PingPayloadDTO;
import com.hidechat.websocket.dto.RealtimeEnvelopeDTO;
import com.hidechat.websocket.dto.RealtimeEnvelopeTypeEnum;
import com.hidechat.websocket.dto.SyncRequestPayloadDTO;
import com.hidechat.websocket.dto.SyncResponsePayloadDTO;
import com.hidechat.websocket.security.JwtHandshakeInterceptor;
import com.hidechat.websocket.security.WebSocketRateLimiter;
import com.hidechat.websocket.session.WebSocketSessionRegistry;
import io.jsonwebtoken.JwtException;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
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
    private final JwtTokenProvider jwtTokenProvider;
    private final Clock clock;

    public ChatWebSocketHandler(ObjectMapper objectMapper,
                                MessageService messageService,
                                ImConversationMapper conversationMapper,
                                WebSocketSessionRegistry sessionRegistry,
                                WebSocketRateLimiter webSocketRateLimiter,
                                JwtTokenProvider jwtTokenProvider,
                                Clock clock) {
        this.objectMapper = objectMapper;
        this.messageService = messageService;
        this.conversationMapper = conversationMapper;
        this.sessionRegistry = sessionRegistry;
        this.webSocketRateLimiter = webSocketRateLimiter;
        this.jwtTokenProvider = jwtTokenProvider;
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
        RealtimeEnvelopeDTO wsMessage = objectMapper.readValue(message.getPayload(), RealtimeEnvelopeDTO.class);
        String userUid = getUserUid(session);
        switch (wsMessage.resolveType()) {
            case AUTH -> handleAuth(session, userUid, wsMessage);
            case PING -> handlePing(session, wsMessage);
            case MESSAGE_SEND -> handleChatSend(session, userUid, wsMessage);
            case MESSAGE_READ -> handleChatRead(userUid, wsMessage);
            case SYNC_REQUEST -> handleSyncRequest(session, userUid, wsMessage);
            default -> sendError(session, wsMessage.getRequestId(), 400001, "实时消息类型不支持", false);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userUid = getUserUid(session);
        if (StringUtils.hasText(userUid)) {
            sessionRegistry.remove(userUid);
        }
    }

    private void handleAuth(WebSocketSession session,
                            String sessionUserUid,
                            RealtimeEnvelopeDTO wsMessage) throws IOException {
        AuthPayloadDTO authPayload = objectMapper.treeToValue(wsMessage.getData(), AuthPayloadDTO.class);
        if (!StringUtils.hasText(authPayload.getAccessToken())) {
            sendError(session, wsMessage.getRequestId(), 401001, "实时鉴权失败", false);
            return;
        }
        try {
            JwtClaims claims = jwtTokenProvider.parse(authPayload.getAccessToken());
            if (!Objects.equals(claims.userUid(), sessionUserUid)) {
                sendError(session, wsMessage.getRequestId(), 401001, "实时鉴权失败", false);
                return;
            }
            send(session, buildEnvelope(
                RealtimeEnvelopeTypeEnum.AUTH_OK,
                wsMessage.getRequestId(),
                Map.of(
                    "userUid", sessionUserUid,
                    "serverTime", Instant.now(clock).toEpochMilli(),
                    "heartbeatIntervalMs", 25_000,
                    "sessionId", session.getId()
                )
            ));
        } catch (JwtException | IllegalArgumentException ex) {
            sendError(session, wsMessage.getRequestId(), 401001, "实时鉴权失败", false);
        }
    }

    private void handlePing(WebSocketSession session, RealtimeEnvelopeDTO wsMessage) throws IOException {
        PingPayloadDTO pingPayload = objectMapper.treeToValue(wsMessage.getData(), PingPayloadDTO.class);
        Map<String, Object> payload = new HashMap<>();
        payload.put("serverTime", Instant.now(clock).toEpochMilli());
        if (pingPayload.getClientTime() != null) {
            payload.put("clientTime", pingPayload.getClientTime());
        }
        send(session, buildEnvelope(RealtimeEnvelopeTypeEnum.PONG, wsMessage.getRequestId(), payload));
    }

    private void handleChatSend(WebSocketSession senderSession,
                                String senderUid,
                                RealtimeEnvelopeDTO wsMessage) throws IOException {
        if (!webSocketRateLimiter.allow(senderUid)) {
            sendError(senderSession, wsMessage.getRequestId(), 429001, "WebSocket 消息过于频繁", true);
            return;
        }
        MessageSendPayloadDTO payload = objectMapper.treeToValue(wsMessage.getData(), MessageSendPayloadDTO.class);
        SendMessageRequest request = new SendMessageRequest();
        request.setClientMessageId(payload.getClientMessageId());
        request.setConversationId(payload.getConversationId());
        request.setReceiverUid(payload.getReceiverUid());
        request.setMessageType(payload.getMessageType());
        request.setPayloadType(payload.getPayloadType());
        request.setPayload(payload.getPayload());
        request.setFileId(payload.getFileId());
        request.setClientMsgTime(payload.getClientMsgTime());
        MessageItemVO sentMessage = messageService.sendMessage(senderUid, request);
        Map<String, Object> ackPayload = new HashMap<>();
        ackPayload.put("clientMessageId", sentMessage.getClientMessageId());
        ackPayload.put("messageId", sentMessage.getMessageId());
        ackPayload.put("conversationId", sentMessage.getConversationId());
        ackPayload.put("status", "sent");
        ackPayload.put("serverMsgTime", sentMessage.getServerMsgTime());
        ackPayload.put("message", sentMessage);
        send(senderSession, buildEnvelope(RealtimeEnvelopeTypeEnum.MESSAGE_ACK, wsMessage.getRequestId(), ackPayload));
        WebSocketSession receiverSession = sessionRegistry.get(sentMessage.getReceiverUid());
        if (receiverSession != null && receiverSession.isOpen()) {
            send(receiverSession, buildEnvelope(RealtimeEnvelopeTypeEnum.MESSAGE_RECEIVE, null, sentMessage));
        }
    }

    private void handleChatRead(String readerUid, RealtimeEnvelopeDTO wsMessage) throws IOException {
        MarkMessageReadRequest request = objectMapper.treeToValue(wsMessage.getData(), MarkMessageReadRequest.class);
        messageService.markMessagesRead(readerUid, request);
        String peerUid = resolvePeerUid(request.getConversationId(), readerUid);
        if (!StringUtils.hasText(peerUid)) {
            return;
        }
        WebSocketSession peerSession = sessionRegistry.get(peerUid);
        if (peerSession != null && peerSession.isOpen()) {
            send(peerSession, buildEnvelope(RealtimeEnvelopeTypeEnum.MESSAGE_READ, null, Map.of(
                "conversationId", request.getConversationId(),
                "messageIds", request.getMessageIds() == null ? List.of() : request.getMessageIds(),
                "readerUid", readerUid,
                "readAt", Instant.now(clock).toEpochMilli()
            )));
        }
    }

    private void handleSyncRequest(WebSocketSession session,
                                   String userUid,
                                   RealtimeEnvelopeDTO wsMessage) throws IOException {
        SyncRequestPayloadDTO request = objectMapper.treeToValue(wsMessage.getData(), SyncRequestPayloadDTO.class);
        MessageSyncVO syncResult = messageService.listIncrementalMessages(
            userUid,
            request == null ? null : request.getSinceCursor(),
            request == null ? null : request.getConversationIds(),
            request == null ? null : request.getPageSize()
        );
        SyncResponsePayloadDTO response = new SyncResponsePayloadDTO();
        response.setNextCursor(syncResult.getNextCursor());
        response.setHasMore(syncResult.isHasMore());
        response.setMessages(syncResult.getMessages());
        send(session, buildEnvelope(RealtimeEnvelopeTypeEnum.SYNC_RESPONSE, wsMessage.getRequestId(), response));
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

    private void sendError(WebSocketSession session,
                           String requestId,
                           int code,
                           String message,
                           boolean retryable) throws IOException {
        send(session, buildEnvelope(RealtimeEnvelopeTypeEnum.ERROR, requestId, Map.of(
            "code", code,
            "message", message,
            "retryable", retryable
        )));
    }

    private String buildEnvelope(RealtimeEnvelopeTypeEnum type,
                                 String requestId,
                                 Object data) throws IOException {
        RealtimeEnvelopeDTO envelope = new RealtimeEnvelopeDTO();
        envelope.setType(type.getWireType());
        envelope.setRequestId(requestId);
        envelope.setTimestamp(Instant.now(clock).toEpochMilli());
        envelope.setData(objectMapper.valueToTree(data));
        return objectMapper.writeValueAsString(envelope);
    }

    private void send(WebSocketSession session, String payload) throws IOException {
        session.sendMessage(new TextMessage(payload));
    }

    private String getUserUid(WebSocketSession session) {
        Object userUid = session.getAttributes().get(JwtHandshakeInterceptor.ATTR_USER_UID);
        return userUid == null ? null : userUid.toString();
    }
}
