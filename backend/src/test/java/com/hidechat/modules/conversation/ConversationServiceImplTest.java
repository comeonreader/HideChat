package com.hidechat.modules.conversation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.service.impl.ConversationServiceImpl;
import com.hidechat.modules.conversation.vo.ConversationItemVO;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImUnreadCounterEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImUnreadCounterMapper;
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

@ExtendWith(MockitoExtension.class)
class ConversationServiceImplTest {

    @Mock
    private ImConversationMapper conversationMapper;

    @Mock
    private ImContactMapper contactMapper;

    @Mock
    private ImUnreadCounterMapper unreadCounterMapper;

    @Mock
    private UserService userService;

    private ConversationServiceImpl conversationService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-07T00:00:00Z"), ZoneOffset.UTC);
        conversationService = new ConversationServiceImpl(
            conversationMapper,
            contactMapper,
            unreadCounterMapper,
            userService,
            new IdGenerator(),
            new RandomValueGenerator(),
            clock
        );
    }

    @Test
    void shouldCreateConversationWhenNotExists() {
        when(contactMapper.selectOne(any())).thenReturn(buildContact("u_1001", "u_1002"));
        when(conversationMapper.selectOne(any())).thenReturn(null);
        mockCommonLookups();

        CreateSingleConversationRequest request = new CreateSingleConversationRequest();
        request.setPeerUid("u_1002");

        ConversationItemVO vo = conversationService.createSingleConversation("u_1001", request);

        assertEquals("u_1002", vo.getPeerUid());
        verify(conversationMapper).insert(any(ImConversationEntity.class));
    }

    @Test
    void shouldListConversations() {
        ImConversationEntity entity = buildConversation("c_1001", "u_1001", "u_1002");
        entity.setLastMessageType("file");
        entity.setLastMessagePreview("project-draft-v3.pdf");
        when(conversationMapper.selectList(any())).thenReturn(List.of(entity));
        when(contactMapper.selectList(any())).thenReturn(List.of(buildContact("u_1001", "u_1002")));
        when(unreadCounterMapper.selectList(any())).thenReturn(List.of());
        when(userService.getUserProfiles(any())).thenReturn(Map.of("u_1002", buildProfile("u_1002")));

        List<ConversationItemVO> list = conversationService.listConversations("u_1001");

        assertEquals(1, list.size());
        assertEquals("c_1001", list.get(0).getConversationId());
        assertEquals("hide_1002", list.get(0).getDisplayUserId());
        assertEquals("[文件消息]", list.get(0).getLastMessagePreview());
        assertEquals("masked", list.get(0).getPreviewStrategy());
        assertEquals("recently_active", list.get(0).getOnlineStatus());
    }

    @Test
    void shouldClearUnreadExistingCounter() {
        when(conversationMapper.selectOne(any())).thenReturn(buildConversation("c_1001", "u_1001", "u_1002"));
        ImUnreadCounterEntity counter = new ImUnreadCounterEntity();
        counter.setConversationId("c_1001");
        counter.setOwnerUid("u_1001");
        counter.setUnreadCount(5);
        when(unreadCounterMapper.selectOne(any())).thenReturn(counter);

        ClearUnreadRequest request = new ClearUnreadRequest();
        request.setConversationId("c_1001");

        conversationService.clearUnread("u_1001", request);

        verify(unreadCounterMapper).updateById(counter);
        assertEquals(0, counter.getUnreadCount());
    }

    @Test
    void shouldInsertUnreadCounterWhenMissing() {
        when(conversationMapper.selectOne(any())).thenReturn(buildConversation("c_1001", "u_1001", "u_1002"));
        when(unreadCounterMapper.selectOne(any())).thenReturn(null);

        ClearUnreadRequest request = new ClearUnreadRequest();
        request.setConversationId("c_1001");

        conversationService.clearUnread("u_1001", request);

        verify(unreadCounterMapper).insert(any(ImUnreadCounterEntity.class));
    }

    @Test
    void shouldRejectConversationWithoutContact() {
        when(contactMapper.selectOne(any())).thenReturn(null);

        CreateSingleConversationRequest request = new CreateSingleConversationRequest();
        request.setPeerUid("u_1002");

        assertThrows(BusinessException.class, () -> conversationService.createSingleConversation("u_1001", request));
    }

    @Test
    void shouldRejectClearUnreadForNonParticipant() {
        when(conversationMapper.selectOne(any())).thenReturn(buildConversation("c_1001", "u_2001", "u_2002"));

        ClearUnreadRequest request = new ClearUnreadRequest();
        request.setConversationId("c_1001");

        BusinessException exception = assertThrows(BusinessException.class,
            () -> conversationService.clearUnread("u_1001", request));

        assertEquals(403001, exception.getCode());
    }

    private void mockCommonLookups() {
        when(contactMapper.selectList(any())).thenReturn(List.of(buildContact("u_1001", "u_1002")));
        when(unreadCounterMapper.selectList(any())).thenReturn(List.of());
        when(userService.getUserProfiles(any())).thenReturn(Map.of("u_1002", buildProfile("u_1002")));
    }

    private ImContactEntity buildContact(String ownerUid, String peerUid) {
        ImContactEntity entity = new ImContactEntity();
        entity.setOwnerUid(ownerUid);
        entity.setPeerUid(peerUid);
        entity.setRemarkName("Friend");
        return entity;
    }

    private ImConversationEntity buildConversation(String id, String a, String b) {
        ImConversationEntity entity = new ImConversationEntity();
        entity.setConversationId(id);
        entity.setUserAUid(a);
        entity.setUserBUid(b);
        return entity;
    }

    private UserProfileVO buildProfile(String userUid) {
        UserProfileVO vo = new UserProfileVO();
        vo.setUserUid(userUid);
        vo.setDisplayUserId("hide_1002");
        vo.setNickname("User " + userUid);
        return vo;
    }
}
