package com.hidechat.websocket;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.modules.message.vo.MessageSyncVO;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.security.SecurityWebProperties;
import com.hidechat.security.jwt.JwtProperties;
import com.hidechat.security.jwt.JwtTokenProvider;
import com.hidechat.websocket.handler.ChatWebSocketHandler;
import com.hidechat.websocket.security.JwtHandshakeInterceptor;
import com.hidechat.websocket.security.WebSocketRateLimiter;
import com.hidechat.websocket.session.WebSocketSessionRegistry;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketHandlerTest {

    @Mock
    private MessageService messageService;

    @Mock
    private ImConversationMapper conversationMapper;

    @Mock
    private WebSocketSession senderSession;

    @Mock
    private WebSocketSession receiverSession;

    private WebSocketSessionRegistry sessionRegistry;
    private ChatWebSocketHandler handler;
    private JwtTokenProvider jwtTokenProvider;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-04-08T00:00:00Z"), ZoneOffset.UTC);
        sessionRegistry = new WebSocketSessionRegistry();
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("test-secret-key-test-secret-key-123456");
        jwtProperties.setIssuer("hidechat-test");
        jwtTokenProvider = new JwtTokenProvider(jwtProperties, fixedClock);
        handler = new ChatWebSocketHandler(
            new ObjectMapper(),
            messageService,
            conversationMapper,
            sessionRegistry,
            new WebSocketRateLimiter(new SecurityWebProperties(), fixedClock),
            jwtTokenProvider,
            fixedClock
        );
    }

    @Test
    void shouldRegisterAndRemoveSession() throws Exception {
        when(senderSession.getAttributes()).thenReturn(Map.of(JwtHandshakeInterceptor.ATTR_USER_UID, "u_1001"));

        handler.afterConnectionEstablished(senderSession);
        assertTrue(sessionRegistry.contains("u_1001"));

        handler.afterConnectionClosed(senderSession, CloseStatus.NORMAL);
        assertFalse(sessionRegistry.contains("u_1001"));
    }

    @Test
    void shouldAckSenderAndPushReceiverOnChatSend() throws Exception {
        when(senderSession.getAttributes()).thenReturn(Map.of(JwtHandshakeInterceptor.ATTR_USER_UID, "u_1001"));
        when(receiverSession.isOpen()).thenReturn(true);
        sessionRegistry.put("u_1002", receiverSession);

        MessageItemVO vo = new MessageItemVO();
        vo.setMessageId("m_1001");
        vo.setClientMessageId("cm_1001");
        vo.setConversationId("c_1001");
        vo.setSenderUid("u_1001");
        vo.setReceiverUid("u_1002");
        vo.setMessageType("text");
        vo.setPayloadType("encrypted");
        vo.setPayload("cipher");
        vo.setServerStatus("delivered");
        when(messageService.sendMessage(any(), any())).thenReturn(vo);

        handler.handleTextMessage(senderSession, new TextMessage("""
            {"type":"CHAT_SEND","requestId":"req_msg_1","data":{"clientMessageId":"cm_1001","conversationId":"c_1001","receiverUid":"u_1002","messageType":"text","payloadType":"encrypted","payload":"cipher","clientMsgTime":1712300000000}}
            """));

        verify(senderSession).sendMessage(argThat((TextMessage payload) -> payload.getPayload().contains("\"type\":\"message_ack\"")
            && payload.getPayload().contains("\"requestId\":\"req_msg_1\"")
            && payload.getPayload().contains("\"clientMessageId\":\"cm_1001\"")
            && payload.getPayload().contains("\"status\":\"sent\"")));
        verify(receiverSession).sendMessage(argThat((TextMessage payload) -> payload.getPayload().contains("\"type\":\"message_receive\"")));
    }

    @Test
    void shouldReplyPongOnPing() throws Exception {
        when(senderSession.getAttributes()).thenReturn(Map.of(JwtHandshakeInterceptor.ATTR_USER_UID, "u_1001"));

        handler.handleTextMessage(senderSession, new TextMessage("""
            {"type":"PING","requestId":"req_ping_1","data":{"clientTime":1712300000000}}
            """));

        verify(senderSession).sendMessage(argThat((TextMessage payload) -> payload.getPayload().contains("\"type\":\"pong\"")
            && payload.getPayload().contains("\"requestId\":\"req_ping_1\"")));
    }

    @Test
    void shouldReplyAuthOkOnAuth() throws Exception {
        String accessToken = jwtTokenProvider.createAccessToken("u_1001", "token_1");
        when(senderSession.getAttributes()).thenReturn(Map.of(JwtHandshakeInterceptor.ATTR_USER_UID, "u_1001"));
        when(senderSession.getId()).thenReturn("ws_1001");

        handler.handleTextMessage(senderSession, new TextMessage("""
            {"type":"auth","requestId":"req_auth_1","data":{"accessToken":"%s"}}
            """.formatted(accessToken)));

        verify(senderSession).sendMessage(argThat((TextMessage payload) -> payload.getPayload().contains("\"type\":\"auth_ok\"")
            && payload.getPayload().contains("\"requestId\":\"req_auth_1\"")
            && payload.getPayload().contains("\"sessionId\":\"ws_1001\"")));
    }

    @Test
    void shouldNotifyPeerOnChatRead() throws Exception {
        when(senderSession.getAttributes()).thenReturn(Map.of(JwtHandshakeInterceptor.ATTR_USER_UID, "u_1001"));
        when(receiverSession.isOpen()).thenReturn(true);
        sessionRegistry.put("u_1002", receiverSession);

        ImConversationEntity conversation = new ImConversationEntity();
        conversation.setConversationId("c_1001");
        conversation.setUserAUid("u_1001");
        conversation.setUserBUid("u_1002");
        when(conversationMapper.selectOne(any())).thenReturn(conversation);

        handler.handleTextMessage(senderSession, new TextMessage("""
            {"type":"message_read","data":{"conversationId":"c_1001","messageIds":["m_1001"]}}
            """));

        verify(messageService).markMessagesRead(eq("u_1001"), any());
        verify(receiverSession).sendMessage(argThat((TextMessage payload) -> payload.getPayload().contains("\"type\":\"message_read\"")));
    }

    @Test
    void shouldReplySyncResponseOnSyncRequest() throws Exception {
        MessageItemVO item = new MessageItemVO();
        item.setMessageId("m_1002");
        MessageSyncVO syncVO = new MessageSyncVO();
        syncVO.setMessages(java.util.List.of(item));
        syncVO.setHasMore(false);
        syncVO.setNextCursor("1775606402000");
        when(senderSession.getAttributes()).thenReturn(Map.of(JwtHandshakeInterceptor.ATTR_USER_UID, "u_1001"));
        when(messageService.listIncrementalMessages(eq("u_1001"), eq("1775606401000"), eq(java.util.List.of("c_1001")), eq(50)))
            .thenReturn(syncVO);

        handler.handleTextMessage(senderSession, new TextMessage("""
            {"type":"sync_request","requestId":"req_sync_1","data":{"sinceCursor":"1775606401000","conversationIds":["c_1001"],"pageSize":50}}
            """));

        verify(senderSession).sendMessage(argThat((TextMessage payload) -> payload.getPayload().contains("\"type\":\"sync_response\"")
            && payload.getPayload().contains("\"requestId\":\"req_sync_1\"")
            && payload.getPayload().contains("\"nextCursor\":\"1775606402000\"")));
    }
}
