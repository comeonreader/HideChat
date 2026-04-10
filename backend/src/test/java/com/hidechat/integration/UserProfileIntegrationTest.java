package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.constant.RedisKeyConstants;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

class UserProfileIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ImUserMapper userMapper;

    @Autowired
    private ImUserAuthMapper userAuthMapper;

    @Autowired
    private IdGenerator idGenerator;

    @Test
    void shouldGetAndUpdateProfileThroughHttpWhileRefreshingRedisCache() {
        seedUser("u_it_1001", "Integration User", "integration@hide.chat");

        HttpHeaders headers = bearerHeaders("u_it_1001");
        ResponseEntity<String> getResponse = get("/api/user/me", headers);

        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Integration User", readTree(getResponse).path("data").path("nickname").asText());
        assertEquals("hide_uit1001", readTree(getResponse).path("data").path("displayUserId").asText());
        assertTrue(readTree(getResponse).path("data").path("email").isMissingNode());

        String cacheKey = RedisKeyConstants.userProfileKey("u_it_1001");
        String cachedJson = stringRedisTemplate.opsForValue().get(cacheKey);
        assertNotNull(cachedJson);
        assertTrue(cachedJson.contains("Integration User"));

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNickname("Updated User");
        request.setAvatarUrl("https://cdn.hidechat.test/avatar.png");

        ResponseEntity<String> updateResponse = put("/api/user/profile", request, headers);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals(0, readTree(updateResponse).path("code").asInt());

        ImUserEntity updatedUser = userMapper.selectById(userMapper.selectOne(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ImUserEntity>()
                .eq(ImUserEntity::getUserUid, "u_it_1001")
        ).getId());
        assertEquals("Updated User", updatedUser.getNickname());
        assertEquals("https://cdn.hidechat.test/avatar.png", updatedUser.getAvatarUrl());

        String refreshedJson = stringRedisTemplate.opsForValue().get(cacheKey);
        assertNotNull(refreshedJson);
        assertTrue(refreshedJson.contains("Updated User"));
        assertTrue(refreshedJson.contains("hide_uit1001"));
    }

    @Test
    void shouldRejectProfileRequestWithoutAuthentication() {
        seedUser("u_it_1001", "Integration User", "integration@hide.chat");

        ResponseEntity<String> response = get("/api/user/me", new HttpHeaders());

        assertTrue(response.getStatusCode().value() == 401 || response.getStatusCode().value() == 403);
    }

    @Test
    void shouldServePublicSystemEndpointOverHttp() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/system/fortune/today", String.class);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("\"title\":\"今日运势\""));
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
