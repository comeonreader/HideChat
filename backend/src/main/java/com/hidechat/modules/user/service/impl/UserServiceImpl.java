package com.hidechat.modules.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.modules.user.cache.UserProfileCacheRepository;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImUserAuthMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

@Service
public class UserServiceImpl implements UserService {

    private final ImUserMapper userMapper;
    private final ImUserAuthMapper userAuthMapper;
    private final UserProfileCacheRepository userProfileCacheRepository;
    private final Clock clock;

    public UserServiceImpl(ImUserMapper userMapper,
                           ImUserAuthMapper userAuthMapper,
                           UserProfileCacheRepository userProfileCacheRepository,
                           Clock clock) {
        this.userMapper = userMapper;
        this.userAuthMapper = userAuthMapper;
        this.userProfileCacheRepository = userProfileCacheRepository;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileVO getUserProfile(String userUid) {
        return userProfileCacheRepository.get(userUid)
            .orElseGet(() -> {
                UserProfileVO profile = loadUserProfile(userUid);
                userProfileCacheRepository.put(profile);
                return profile;
            });
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, UserProfileVO> getUserProfiles(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        Map<String, UserProfileVO> cached = new HashMap<>(userProfileCacheRepository.getBatch(userUids));
        Set<String> missing = userUids.stream()
            .filter(uid -> !cached.containsKey(uid))
            .collect(Collectors.toSet());
        if (!missing.isEmpty()) {
            Map<String, UserProfileVO> loaded = loadUserProfiles(missing);
            loaded.values().forEach(userProfileCacheRepository::put);
            cached.putAll(loaded);
        }
        return cached;
    }

    @Override
    @Transactional
    public void updateProfile(String userUid, UpdateProfileRequest request) {
        LambdaQueryWrapper<ImUserEntity> wrapper = new LambdaQueryWrapper<ImUserEntity>()
            .eq(ImUserEntity::getUserUid, userUid);
        ImUserEntity entity = userMapper.selectOne(wrapper);
        if (entity == null) {
            throw new BusinessException(404001, "用户不存在");
        }
        entity.setNickname(request.getNickname());
        entity.setAvatarUrl(request.getAvatarUrl());
        entity.setUpdatedAt(LocalDateTime.now(clock));
        userMapper.updateById(entity);
        userProfileCacheRepository.evict(userUid);
        userProfileCacheRepository.put(buildProfileVO(entity, resolvePrimaryEmail(userUid)));
    }

    private UserProfileVO loadUserProfile(String userUid) {
        Map<String, UserProfileVO> result = loadUserProfiles(Collections.singleton(userUid));
        UserProfileVO profile = result.get(userUid);
        if (profile == null) {
            throw new BusinessException(404001, "用户不存在");
        }
        return profile;
    }

    private Map<String, UserProfileVO> loadUserProfiles(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        List<ImUserEntity> users = userMapper.selectList(new LambdaQueryWrapper<ImUserEntity>()
            .in(ImUserEntity::getUserUid, userUids));
        if (users.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, ImUserEntity> userByUid = users.stream()
            .collect(Collectors.toMap(ImUserEntity::getUserUid, user -> user));
        Map<String, String> emailByUid = loadPrimaryEmails(userByUid.keySet());
        Map<String, UserProfileVO> result = new HashMap<>();
        userByUid.forEach((uid, entity) -> result.put(uid, buildProfileVO(entity, emailByUid.get(uid))));
        return result;
    }

    private Map<String, String> loadPrimaryEmails(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        List<ImUserAuthEntity> authEntities = userAuthMapper.selectList(new LambdaQueryWrapper<ImUserAuthEntity>()
            .eq(ImUserAuthEntity::getAuthType, AuthConstants.AUTH_TYPE_EMAIL_PASSWORD)
            .in(ImUserAuthEntity::getUserUid, userUids));
        return authEntities.stream()
            .collect(Collectors.toMap(ImUserAuthEntity::getUserUid, ImUserAuthEntity::getAuthIdentifier, (a, b) -> a));
    }

    private String resolvePrimaryEmail(String userUid) {
        Map<String, String> map = loadPrimaryEmails(Collections.singleton(userUid));
        return map.get(userUid);
    }

    private UserProfileVO buildProfileVO(ImUserEntity entity, String email) {
        if (entity == null) {
            return null;
        }
        UserProfileVO vo = new UserProfileVO();
        vo.setUserUid(entity.getUserUid());
        vo.setNickname(entity.getNickname());
        vo.setAvatarUrl(entity.getAvatarUrl());
        vo.setEmail(email);
        return vo;
    }
}
