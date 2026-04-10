package com.hidechat.modules.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.constant.AuthConstants;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.modules.user.cache.UserProfileCacheRepository;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.modules.user.vo.UserSearchItemVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImUserAuthEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
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
import java.util.Comparator;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

@Service
public class UserServiceImpl implements UserService {

    private final ImUserMapper userMapper;
    private final ImUserAuthMapper userAuthMapper;
    private final ImContactMapper contactMapper;
    private final UserProfileCacheRepository userProfileCacheRepository;
    private final Clock clock;

    public UserServiceImpl(ImUserMapper userMapper,
                           ImUserAuthMapper userAuthMapper,
                           ImContactMapper contactMapper,
                           UserProfileCacheRepository userProfileCacheRepository,
                           Clock clock) {
        this.userMapper = userMapper;
        this.userAuthMapper = userAuthMapper;
        this.contactMapper = contactMapper;
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
    public List<UserSearchItemVO> searchUsers(String currentUserUid, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Collections.emptyList();
        }
        String normalizedKeyword = keyword.trim().toLowerCase(Locale.ROOT);
        List<ImUserEntity> users = userMapper.selectList(new LambdaQueryWrapper<ImUserEntity>()
            .eq(ImUserEntity::getStatus, AuthConstants.USER_STATUS_NORMAL));
        if (CollectionUtils.isEmpty(users)) {
            return Collections.emptyList();
        }

        Set<String> peerUids = contactMapper.selectList(new LambdaQueryWrapper<ImContactEntity>()
                .eq(ImContactEntity::getOwnerUid, currentUserUid))
            .stream()
            .map(ImContactEntity::getPeerUid)
            .collect(Collectors.toSet());

        return users.stream()
            .filter(user -> !Objects.equals(currentUserUid, user.getUserUid()))
            .map(user -> toUserSearchItem(user, peerUids, normalizedKeyword))
            .filter(Objects::nonNull)
            .sorted(Comparator
                .comparing((UserSearchItemVO item) -> isExactDisplayUserIdMatch(item, normalizedKeyword)).reversed()
                .thenComparing((UserSearchItemVO item) -> isExactNicknameMatch(item, normalizedKeyword)).reversed()
                .thenComparing(UserSearchItemVO::getNickname, Comparator.nullsLast(String::compareToIgnoreCase)))
            .limit(20)
            .toList();
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

    private UserSearchItemVO toUserSearchItem(ImUserEntity entity, Set<String> peerUids, String keyword) {
        String displayUserId = buildDisplayUserId(entity.getUserUid());
        String nickname = Objects.requireNonNullElse(entity.getNickname(), "");
        String normalizedNickname = nickname.toLowerCase(Locale.ROOT);
        String normalizedDisplayUserId = displayUserId.toLowerCase(Locale.ROOT);
        String normalizedUserUid = Objects.requireNonNullElse(entity.getUserUid(), "").toLowerCase(Locale.ROOT);

        String matchType = null;
        if (normalizedDisplayUserId.contains(keyword) || normalizedUserUid.contains(keyword)) {
            matchType = "display_user_id";
        } else if (normalizedNickname.contains(keyword)) {
            matchType = "nickname";
        }
        if (matchType == null) {
            return null;
        }

        UserSearchItemVO item = new UserSearchItemVO();
        item.setUserUid(entity.getUserUid());
        item.setDisplayUserId(displayUserId);
        item.setNickname(entity.getNickname());
        item.setAvatarUrl(entity.getAvatarUrl());
        item.setMatchType(matchType);
        item.setAlreadyAdded(peerUids.contains(entity.getUserUid()));
        return item;
    }

    private boolean isExactDisplayUserIdMatch(UserSearchItemVO item, String keyword) {
        return item != null && item.getDisplayUserId() != null && item.getDisplayUserId().equalsIgnoreCase(keyword);
    }

    private boolean isExactNicknameMatch(UserSearchItemVO item, String keyword) {
        return item != null && item.getNickname() != null && item.getNickname().equalsIgnoreCase(keyword);
    }

    private String buildDisplayUserId(String userUid) {
        if (!StringUtils.hasText(userUid)) {
            return "hide_unknown";
        }
        String compact = userUid.replaceAll("[^A-Za-z0-9]", "");
        String suffix = compact.length() <= 8 ? compact : compact.substring(compact.length() - 8);
        return "hide_" + suffix.toLowerCase(Locale.ROOT);
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
        vo.setDisplayUserId(buildDisplayUserId(entity.getUserUid()));
        vo.setNickname(entity.getNickname());
        vo.setAvatarUrl(entity.getAvatarUrl());
        return vo;
    }
}
