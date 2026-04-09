package com.hidechat.modules.message;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.impl.MessageServiceImpl;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImMessageEntity;
import com.hidechat.persistence.entity.ImMessageReadReceiptEntity;
import com.hidechat.persistence.entity.ImUnreadCounterEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImMessageMapper;
import com.hidechat.persistence.mapper.ImMessageReadReceiptMapper;
import com.hidechat.persistence.mapper.ImUnreadCounterMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @Mock
    private ImMessageMapper messageMapper;

    @Mock
    private ImConversationMapper conversationMapper;

    @Mock
    private ImMessageReadReceiptMapper readReceiptMapper;

    @Mock
    private ImUnreadCounterMapper unreadCounterMapper;

    @Mock
    private ImContactMapper contactMapper;

    private MessageServiceImpl messageService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-08T00:00:00Z"), ZoneOffset.UTC);
        messageService = new MessageServiceImpl(
            messageMapper,
            conversationMapper,
            readReceiptMapper,
            unreadCounterMapper,
            contactMapper,
            new IdGenerator(),
            new RandomValueGenerator(),
            clock
        );
    }

    @Test
    void shouldSendMessageAndUpdateConversationState() {
        when(conversationMapper.selectOne(any())).thenReturn(buildConversation());
        when(contactMapper.selectOne(any()))
            .thenReturn(buildContact("u_1001", "u_1002"))
            .thenReturn(buildContact("u_1002", "u_1001"));
        when(unreadCounterMapper.selectOne(any())).thenReturn(null);

        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId("c_1001");
        request.setReceiverUid("u_1002");
        request.setMessageType("text");
        request.setPayloadType("encrypted");
        request.setPayload("cipher");
        request.setClientMsgTime(1712534400000L);

        MessageItemVO result = messageService.sendMessage("u_1001", request);

        assertEquals("c_1001", result.getConversationId());
        assertEquals("u_1001", result.getSenderUid());
        assertEquals("u_1002", result.getReceiverUid());
        assertEquals("delivered", result.getServerStatus());
        verify(messageMapper).insert(any(ImMessageEntity.class));
        verify(conversationMapper).updateById(any(ImConversationEntity.class));
        verify(contactMapper, times(2)).updateById(any(ImContactEntity.class));
        verify(unreadCounterMapper).insert(any(ImUnreadCounterEntity.class));
    }

    @Test
    void shouldListHistoryWithNextCursor() {
        when(conversationMapper.selectOne(any())).thenReturn(buildConversation());
        when(messageMapper.selectList(any())).thenReturn(List.of(
            buildMessage("m_1003", LocalDateTime.of(2026, 4, 8, 0, 0, 3)),
            buildMessage("m_1002", LocalDateTime.of(2026, 4, 8, 0, 0, 2)),
            buildMessage("m_1001", LocalDateTime.of(2026, 4, 8, 0, 0, 1))
        ));

        MessageHistoryVO history = messageService.listHistory("u_1001", "c_1001", null, 2);

        assertEquals(2, history.getList().size());
        assertTrue(history.isHasMore());
        assertEquals("m_1002", history.getList().get(0).getMessageId());
        assertEquals("m_1003", history.getList().get(1).getMessageId());
        assertEquals("1775606402000", history.getNextCursor());
    }

    @Test
    void shouldMarkMessagesReadAndClearUnreadCounter() {
        ImMessageEntity message = buildMessage("m_1001", LocalDateTime.of(2026, 4, 8, 0, 0, 1));
        message.setServerStatus("delivered");
        ImUnreadCounterEntity counter = new ImUnreadCounterEntity();
        counter.setConversationId("c_1001");
        counter.setOwnerUid("u_1002");
        counter.setUnreadCount(3);

        when(conversationMapper.selectOne(any())).thenReturn(buildConversation());
        when(messageMapper.selectList(any())).thenReturn(List.of(message));
        when(readReceiptMapper.selectOne(any())).thenReturn(null);
        when(messageMapper.selectCount(any())).thenReturn(0L);
        when(unreadCounterMapper.selectOne(any())).thenReturn(counter);

        MarkMessageReadRequest request = new MarkMessageReadRequest();
        request.setConversationId("c_1001");
        request.setMessageIds(List.of("m_1001"));

        messageService.markMessagesRead("u_1002", request);

        verify(readReceiptMapper).insert(any(ImMessageReadReceiptEntity.class));
        verify(messageMapper).updateById(message);
        verify(unreadCounterMapper).updateById(counter);
        assertEquals(0, counter.getUnreadCount());
    }

    private ImConversationEntity buildConversation() {
        ImConversationEntity entity = new ImConversationEntity();
        entity.setId(1L);
        entity.setConversationId("c_1001");
        entity.setUserAUid("u_1001");
        entity.setUserBUid("u_1002");
        return entity;
    }

    private ImContactEntity buildContact(String ownerUid, String peerUid) {
        ImContactEntity entity = new ImContactEntity();
        entity.setId(1L);
        entity.setOwnerUid(ownerUid);
        entity.setPeerUid(peerUid);
        return entity;
    }

    private ImMessageEntity buildMessage(String messageId, LocalDateTime serverMsgTime) {
        ImMessageEntity entity = new ImMessageEntity();
        entity.setId(1L);
        entity.setMessageId(messageId);
        entity.setConversationId("c_1001");
        entity.setSenderUid("u_1001");
        entity.setReceiverUid("u_1002");
        entity.setMessageType("text");
        entity.setPayloadType("encrypted");
        entity.setPayload("cipher");
        entity.setClientMsgTime(1712534400000L);
        entity.setServerMsgTime(serverMsgTime);
        entity.setDeleted(Boolean.FALSE);
        return entity;
    }
}
