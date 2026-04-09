package com.hidechat.websocket;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.websocket.handler.ChatWebSocketHandler;
import com.hidechat.websocket.security.JwtHandshakeInterceptor;
import com.hidechat.websocket.security.WebSocketRateLimiter;
import com.hidechat.websocket.session.WebSocketSessionRegistry;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import com.hidechat.security.SecurityWebProperties;

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

    @BeforeEach
    void setUp() {
        sessionRegistry = new WebSocketSessionRegistry();
        handler = new ChatWebSocketHandler(
            new ObjectMapper(),
            messageService,
            conversationMapper,
            sessionRegistry,
            new WebSocketRateLimiter(new SecurityWebProperties(), Clock.fixed(Instant.parse("2026-04-08T00:00:00Z"), ZoneOffset.UTC)),
            Clock.fixed(Instant.parse("2026-04-08T00:00:00Z"), ZoneOffset.UTC)
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
        vo.setConversationId("c_1001");
        vo.setSenderUid("u_1001");
        vo.setReceiverUid("u_1002");
        vo.setMessageType("text");
        vo.setPayloadType("encrypted");
        vo.setPayload("cipher");
        vo.setServerStatus("delivered");
        when(messageService.sendMessage(any(), any())).thenReturn(vo);

        handler.handleTextMessage(senderSession, new TextMessage("""
            {"type":"CHAT_SEND","data":{"messageId":"m_1001","conversationId":"c_1001","receiverUid":"u_1002","messageType":"text","payloadType":"encrypted","payload":"cipher","clientMsgTime":1712300000000}}
            """));

        verify(senderSession).sendMessage(any(TextMessage.class));
        verify(receiverSession).sendMessage(any(TextMessage.class));
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
            {"type":"CHAT_READ","data":{"conversationId":"c_1001","messageIds":["m_1001"]}}
            """));

        verify(messageService).markMessagesRead(eq("u_1001"), any());
        verify(receiverSession).sendMessage(any(TextMessage.class));
    }
}
