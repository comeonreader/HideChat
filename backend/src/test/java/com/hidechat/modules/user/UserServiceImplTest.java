package com.hidechat.modules.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.modules.user.cache.UserProfileCacheRepository;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.impl.UserServiceImpl;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.modules.user.vo.UserSearchItemVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private ImUserMapper userMapper;

    @Mock
    private ImUserAuthMapper userAuthMapper;

    @Mock
    private ImContactMapper contactMapper;

    @Mock
    private UserProfileCacheRepository cacheRepository;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-07T00:00:00Z"), ZoneOffset.UTC);
        userService = new UserServiceImpl(userMapper, userAuthMapper, contactMapper, cacheRepository, clock);
    }

    @Test
    void shouldReturnProfileFromCache() {
        UserProfileVO cached = new UserProfileVO();
        cached.setUserUid("u_1001");
        cached.setNickname("Alice");
        when(cacheRepository.get("u_1001")).thenReturn(Optional.of(cached));

        UserProfileVO result = userService.getUserProfile("u_1001");

        assertEquals("Alice", result.getNickname());
    }

    @Test
    void shouldLoadProfileWhenCacheMiss() {
        when(cacheRepository.get("u_1001")).thenReturn(Optional.empty());
        when(userMapper.selectList(any())).thenReturn(List.of(buildUser("u_1001", "Alice")));
        when(userAuthMapper.selectList(any())).thenReturn(List.of(buildUserAuth("u_1001", "alice@example.com")));

        UserProfileVO result = userService.getUserProfile("u_1001");

        assertEquals("hide_u1001", result.getDisplayUserId());
        verify(cacheRepository).put(result);
    }

    @Test
    void shouldUpdateProfileAndRefreshCache() {
        ImUserEntity entity = buildUser("u_1001", "Alice");
        entity.setId(1L);
        when(userMapper.selectOne(any())).thenReturn(entity);
        when(userAuthMapper.selectList(any())).thenReturn(List.of(buildUserAuth("u_1001", "alice@example.com")));

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNickname("Alice Updated");
        request.setAvatarUrl("https://cdn/avatar.png");

        userService.updateProfile("u_1001", request);

        ArgumentCaptor<ImUserEntity> captor = ArgumentCaptor.forClass(ImUserEntity.class);
        verify(userMapper).updateById(captor.capture());
        assertEquals("Alice Updated", captor.getValue().getNickname());
        verify(cacheRepository).evict("u_1001");
        verify(cacheRepository).put(any(UserProfileVO.class));
    }

    @Test
    void shouldThrowWhenUserMissingOnUpdate() {
        when(userMapper.selectOne(any())).thenReturn(null);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNickname("Alice");

        assertThrows(BusinessException.class, () -> userService.updateProfile("u_1001", request));
    }

    @Test
    void shouldSearchUsersByNicknameAndMarkExistingContacts() {
        when(userMapper.selectList(any())).thenReturn(List.of(
            buildUser("u_1001", "Alice"),
            buildUser("u_friend_1002", "Bob"),
            buildUser("u_friend_1003", "Bobby")
        ));
        when(contactMapper.selectList(any())).thenReturn(List.of(buildContact("u_1001", "u_friend_1002")));

        List<UserSearchItemVO> results = userService.searchUsers("u_1001", "Bob");

        assertEquals(2, results.size());
        assertEquals("u_friend_1002", results.get(0).getUserUid());
        assertEquals(Boolean.TRUE, results.get(0).getAlreadyAdded());
        assertEquals("nickname", results.get(0).getMatchType());
    }

    @Test
    void shouldSearchUsersByDisplayUserIdWithoutEmailLeak() {
        when(userMapper.selectList(any())).thenReturn(List.of(
            buildUser("u_1001", "Alice"),
            buildUser("u_1002", "Bob")
        ));
        when(contactMapper.selectList(any())).thenReturn(List.of());

        List<UserSearchItemVO> results = userService.searchUsers("u_1001", "hide_u1002");

        assertEquals(1, results.size());
        assertEquals("display_user_id", results.get(0).getMatchType());
        assertEquals("hide_u1002", results.get(0).getDisplayUserId());
    }

    private ImUserEntity buildUser(String userUid, String nickname) {
        ImUserEntity entity = new ImUserEntity();
        entity.setUserUid(userUid);
        entity.setNickname(nickname);
        entity.setStatus((short) 1);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        return entity;
    }

    private ImUserAuthEntity buildUserAuth(String userUid, String email) {
        ImUserAuthEntity entity = new ImUserAuthEntity();
        entity.setUserUid(userUid);
        entity.setAuthIdentifier(email);
        return entity;
    }

    private ImContactEntity buildContact(String ownerUid, String peerUid) {
        ImContactEntity entity = new ImContactEntity();
        entity.setOwnerUid(ownerUid);
        entity.setPeerUid(peerUid);
        return entity;
    }
}
