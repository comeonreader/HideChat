package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImMessageEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImMessageMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

class MessageSecurityIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ImUserMapper userMapper;

    @Autowired
    private ImUserAuthMapper userAuthMapper;

    @Autowired
    private ImConversationMapper conversationMapper;

    @Autowired
    private ImMessageMapper messageMapper;

    @Autowired
    private IdGenerator idGenerator;

    @Test
    void shouldRejectHistoryAndReadForNonParticipant() {
        seedUser("u_owner", "Owner", "owner@hide.chat");
        seedUser("u_peer", "Peer", "peer@hide.chat");
        seedUser("u_intruder", "Intruder", "intruder@hide.chat");
        seedConversation("c_1001", "u_owner", "u_peer");
        seedMessage("m_1001", "c_1001", "u_owner", "u_peer");

        HttpHeaders intruderHeaders = bearerHeaders("u_intruder");

        ResponseEntity<String> historyResponse = get("/api/message/history?conversationId=c_1001&pageSize=20", intruderHeaders);
        assertEquals(200, historyResponse.getStatusCode().value());
        assertEquals(403001, readTree(historyResponse).path("code").asInt());

        ResponseEntity<String> readResponse = post("/api/message/read", java.util.Map.of(
            "conversationId", "c_1001",
            "messageIds", List.of("m_1001")
        ), intruderHeaders);
        assertEquals(200, readResponse.getStatusCode().value());
        assertEquals(403001, readTree(readResponse).path("code").asInt());
    }

    @Test
    void shouldAllowMessagingAndHistoryWithoutMutualContactRelation() {
        seedUser("u_a", "Alice", "alice@hide.chat");
        seedUser("u_b", "Bob", "bob@hide.chat");

        HttpHeaders aliceHeaders = bearerHeaders("u_a");
        HttpHeaders bobHeaders = bearerHeaders("u_b");

        ResponseEntity<String> addAliceContact = post("/api/contact/add", java.util.Map.of(
            "peerUid", "u_b",
            "remarkName", "Bob"
        ), aliceHeaders);
        assertEquals(200, addAliceContact.getStatusCode().value());
        assertEquals(0, readTree(addAliceContact).path("code").asInt());

        ResponseEntity<String> createConversationResponse = post("/api/conversation/single", java.util.Map.of(
            "peerUid", "u_b"
        ), aliceHeaders);
        assertEquals(200, createConversationResponse.getStatusCode().value());
        assertEquals(0, readTree(createConversationResponse).path("code").asInt());

        String conversationId = readTree(createConversationResponse).path("data").path("conversationId").asText();
        assertNotNull(conversationId);

        ResponseEntity<String> sendFromAlice = post("/api/message/send", java.util.Map.of(
            "messageId", "m_a_1",
            "conversationId", conversationId,
            "receiverUid", "u_b",
            "messageType", "text",
            "payloadType", "plain",
            "payload", "hello bob",
            "clientMsgTime", 1712534400000L
        ), aliceHeaders);
        assertEquals(200, sendFromAlice.getStatusCode().value());
        assertEquals(0, readTree(sendFromAlice).path("code").asInt());

        ResponseEntity<String> bobHistory = get("/api/message/history?conversationId=" + conversationId + "&pageSize=20", bobHeaders);
        assertEquals(200, bobHistory.getStatusCode().value());
        assertEquals(0, readTree(bobHistory).path("code").asInt());
        assertEquals(1, readTree(bobHistory).path("data").path("list").size());
        assertEquals("m_a_1", readTree(bobHistory).path("data").path("list").get(0).path("messageId").asText());

        ResponseEntity<String> sendFromBob = post("/api/message/send", java.util.Map.of(
            "messageId", "m_b_1",
            "conversationId", conversationId,
            "receiverUid", "u_a",
            "messageType", "text",
            "payloadType", "plain",
            "payload", "hello alice",
            "clientMsgTime", 1712534401000L
        ), bobHeaders);
        assertEquals(200, sendFromBob.getStatusCode().value());
        assertEquals(0, readTree(sendFromBob).path("code").asInt());

        ResponseEntity<String> addContactResponse = post("/api/contact/add", java.util.Map.of(
            "peerUid", "u_a",
            "remarkName", "Alice"
        ), bobHeaders);
        assertEquals(200, addContactResponse.getStatusCode().value());
        assertEquals(0, readTree(addContactResponse).path("code").asInt());

        ResponseEntity<String> sendAfterAdd = post("/api/message/send", java.util.Map.of(
            "messageId", "m_b_2",
            "conversationId", conversationId,
            "receiverUid", "u_a",
            "messageType", "text",
            "payloadType", "plain",
            "payload", "still works",
            "clientMsgTime", 1712534402000L
        ), bobHeaders);
        assertEquals(200, sendAfterAdd.getStatusCode().value());
        assertEquals(0, readTree(sendAfterAdd).path("code").asInt());

        ResponseEntity<String> aliceHistory = get("/api/message/history?conversationId=" + conversationId + "&pageSize=20", aliceHeaders);
        assertEquals(200, aliceHistory.getStatusCode().value());
        assertEquals(0, readTree(aliceHistory).path("code").asInt());
        assertEquals(3, readTree(aliceHistory).path("data").path("list").size());
        assertEquals("m_b_2", readTree(aliceHistory).path("data").path("list").get(2).path("messageId").asText());
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

    private void seedConversation(String conversationId, String userAUid, String userBUid) {
        ImConversationEntity conversation = new ImConversationEntity();
        conversation.setId(idGenerator.nextId());
        conversation.setConversationId(conversationId);
        conversation.setUserAUid(userAUid);
        conversation.setUserBUid(userBUid);
        conversation.setCreatedAt(LocalDateTime.now().minusDays(1));
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationMapper.insert(conversation);
    }

    private void seedMessage(String messageId, String conversationId, String senderUid, String receiverUid) {
        ImMessageEntity message = new ImMessageEntity();
        message.setId(idGenerator.nextId());
        message.setMessageId(messageId);
        message.setConversationId(conversationId);
        message.setSenderUid(senderUid);
        message.setReceiverUid(receiverUid);
        message.setMessageType("text");
        message.setPayloadType("encrypted");
        message.setPayload("cipher");
        message.setServerStatus("delivered");
        message.setServerMsgTime(LocalDateTime.now());
        message.setDeleted(Boolean.FALSE);
        messageMapper.insert(message);
    }
}
