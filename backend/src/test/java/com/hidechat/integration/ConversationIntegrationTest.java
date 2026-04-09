package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImUnreadCounterEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImUnreadCounterMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

class ConversationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ImUserMapper userMapper;

    @Autowired
    private ImUserAuthMapper userAuthMapper;

    @Autowired
    private ImContactMapper contactMapper;

    @Autowired
    private ImConversationMapper conversationMapper;

    @Autowired
    private ImUnreadCounterMapper unreadCounterMapper;

    @Autowired
    private IdGenerator idGenerator;

    @Test
    void shouldCreateListAndClearUnreadForConversations() {
        LocalDateTime now = LocalDateTime.now();
        seedUser("u_owner", "Owner", "owner@hide.chat");
        seedUser("u_peer_1", "Alice", "alice@hide.chat");
        seedUser("u_peer_2", "Bob", "bob@hide.chat");
        seedContact("u_owner", "u_peer_1", "Alice Remark");
        seedContact("u_owner", "u_peer_2", "Bob Remark");

        HttpHeaders headers = bearerHeaders("u_owner");

        CreateSingleConversationRequest createRequest = new CreateSingleConversationRequest();
        createRequest.setPeerUid("u_peer_1");
        ResponseEntity<String> createResponse = post("/api/conversation/single", createRequest, headers);

        assertEquals(200, createResponse.getStatusCode().value());
        String createdConversationId = readTree(createResponse).path("data").path("conversationId").asText();
        assertNotNull(createdConversationId);

        ImConversationEntity createdConversation = conversationMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ImConversationEntity>()
                .eq(ImConversationEntity::getConversationId, createdConversationId)
        );
        createdConversation.setLastMessagePreview("older message");
        createdConversation.setLastMessageType("text");
        createdConversation.setLastMessageAt(now.minusHours(5));
        conversationMapper.updateById(createdConversation);
        seedUnread("u_owner", createdConversationId, 5, now.minusHours(5));

        seedConversation("c_seed_newer", "u_owner", "u_peer_2", "newer message", now.plusMinutes(30));
        seedUnread("u_owner", "c_seed_newer", 2, now.plusMinutes(30));

        ResponseEntity<String> listResponse = get("/api/conversation/list", headers);

        assertEquals(200, listResponse.getStatusCode().value());
        var listBody = readTree(listResponse);
        assertEquals(2, listBody.path("data").size());
        assertEquals("c_seed_newer", listBody.path("data").get(0).path("conversationId").asText());
        assertEquals(2, listBody.path("data").get(0).path("unreadCount").asInt());
        assertEquals(createdConversationId, listBody.path("data").get(1).path("conversationId").asText());
        assertEquals(5, listBody.path("data").get(1).path("unreadCount").asInt());

        ClearUnreadRequest clearUnreadRequest = new ClearUnreadRequest();
        clearUnreadRequest.setConversationId(createdConversationId);
        ResponseEntity<String> clearResponse = post("/api/conversation/clear-unread", clearUnreadRequest, headers);

        assertEquals(200, clearResponse.getStatusCode().value());
        assertEquals(0, readTree(clearResponse).path("code").asInt());
        assertEquals(0, unreadCounterMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ImUnreadCounterEntity>()
                .eq(ImUnreadCounterEntity::getOwnerUid, "u_owner")
                .eq(ImUnreadCounterEntity::getConversationId, createdConversationId)
        ).getUnreadCount());
    }

    private void seedConversation(String conversationId,
                                  String ownerUid,
                                  String peerUid,
                                  String preview,
                                  LocalDateTime updatedAt) {
        ImConversationEntity entity = new ImConversationEntity();
        entity.setId(idGenerator.nextId());
        entity.setConversationId(conversationId);
        entity.setUserAUid(ownerUid.compareTo(peerUid) <= 0 ? ownerUid : peerUid);
        entity.setUserBUid(ownerUid.compareTo(peerUid) <= 0 ? peerUid : ownerUid);
        entity.setLastMessageType("text");
        entity.setLastMessagePreview(preview);
        entity.setLastMessageAt(updatedAt);
        entity.setCreatedAt(updatedAt.minusDays(1));
        entity.setUpdatedAt(updatedAt);
        conversationMapper.insert(entity);
    }

    private void seedUnread(String ownerUid, String conversationId, int unreadCount, LocalDateTime updatedAt) {
        ImUnreadCounterEntity unreadCounter = new ImUnreadCounterEntity();
        unreadCounter.setId(idGenerator.nextId());
        unreadCounter.setOwnerUid(ownerUid);
        unreadCounter.setConversationId(conversationId);
        unreadCounter.setUnreadCount(unreadCount);
        unreadCounter.setUpdatedAt(updatedAt);
        unreadCounterMapper.insert(unreadCounter);
    }

    private void seedContact(String ownerUid, String peerUid, String remarkName) {
        ImContactEntity entity = new ImContactEntity();
        entity.setId(idGenerator.nextId());
        entity.setOwnerUid(ownerUid);
        entity.setPeerUid(peerUid);
        entity.setRemarkName(remarkName);
        entity.setPinned(Boolean.FALSE);
        entity.setCreatedAt(LocalDateTime.now().minusDays(1));
        entity.setUpdatedAt(LocalDateTime.now().minusDays(1));
        contactMapper.insert(entity);
    }

    private void seedUser(String userUid, String nickname, String email) {
        ImUserEntity user = new ImUserEntity();
        user.setId(idGenerator.nextId());
        user.setUserUid(userUid);
        user.setNickname(nickname);
        user.setStatus((short) 1);
        userMapper.insert(user);

        ImUserAuthEntity auth = new ImUserAuthEntity();
        auth.setId(idGenerator.nextId());
        auth.setUserUid(userUid);
        auth.setAuthType(AuthConstants.AUTH_TYPE_EMAIL_PASSWORD);
        auth.setAuthIdentifier(email);
        auth.setVerified(Boolean.TRUE);
        userAuthMapper.insert(auth);
    }
}
