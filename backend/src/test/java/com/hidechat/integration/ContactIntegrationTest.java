package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

class ContactIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ImUserMapper userMapper;

    @Autowired
    private ImUserAuthMapper userAuthMapper;

    @Autowired
    private ImContactMapper contactMapper;

    @Autowired
    private IdGenerator idGenerator;

    @Test
    void shouldAddContactsAndReturnListSortedByPinnedThenLastMessageAt() {
        seedUser("u_owner", "Owner", "owner@hide.chat");
        seedUser("u_peer_1", "Alice", "alice@hide.chat");
        seedUser("u_peer_2", "Bob", "bob@hide.chat");
        seedUser("u_peer_3", "Carol", "carol@hide.chat");

        HttpHeaders headers = bearerHeaders("u_owner");

        assertEquals(200, addContact(headers, "u_peer_1", "Pinned Friend").getStatusCode().value());
        assertEquals(200, addContact(headers, "u_peer_2", "Second Friend").getStatusCode().value());
        assertEquals(200, addContact(headers, "u_peer_3", "Newest Friend").getStatusCode().value());

        LocalDateTime now = LocalDateTime.now();
        updateContact("u_owner", "u_peer_1", true, now.minusDays(3));
        updateContact("u_owner", "u_peer_2", false, now.minusHours(6));
        updateContact("u_owner", "u_peer_3", false, now.minusHours(1));

        ResponseEntity<String> response = get("/api/contact/list", headers);

        assertEquals(200, response.getStatusCode().value());
        var body = readTree(response);
        assertEquals(3, body.path("data").size());

        assertEquals("u_peer_1", body.path("data").get(0).path("peerUid").asText());
        assertEquals("Pinned Friend", body.path("data").get(0).path("remarkName").asText());
        assertEquals("u_peer_3", body.path("data").get(1).path("peerUid").asText());
        assertEquals("u_peer_2", body.path("data").get(2).path("peerUid").asText());
        assertNotNull(body.path("data").get(1).path("lastMessageAt"));
    }

    private ResponseEntity<String> addContact(HttpHeaders headers, String peerUid, String remarkName) {
        AddContactRequest request = new AddContactRequest();
        request.setPeerUid(peerUid);
        request.setRemarkName(remarkName);
        return post("/api/contact/add", request, headers);
    }

    private void updateContact(String ownerUid, String peerUid, boolean pinned, LocalDateTime lastMessageAt) {
        ImContactEntity contact = contactMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ImContactEntity>()
                .eq(ImContactEntity::getOwnerUid, ownerUid)
                .eq(ImContactEntity::getPeerUid, peerUid)
        );
        contact.setPinned(pinned);
        contact.setLastMessageAt(lastMessageAt);
        contactMapper.updateById(contact);
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
