package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
