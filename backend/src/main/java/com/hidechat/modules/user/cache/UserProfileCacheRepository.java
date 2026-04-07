package com.hidechat.modules.user.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.constant.RedisKeyConstants;
import com.hidechat.modules.user.vo.UserProfileVO;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

@Repository
public class UserProfileCacheRepository {

    private static final Duration PROFILE_TTL = Duration.ofMinutes(10);
    private static final Logger log = LoggerFactory.getLogger(UserProfileCacheRepository.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public UserProfileCacheRepository(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<UserProfileVO> get(String userUid) {
        String cacheKey = RedisKeyConstants.userProfileKey(userUid);
        String json = redisTemplate.opsForValue().get(cacheKey);
        if (json == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(json, UserProfileVO.class));
        } catch (JsonProcessingException exception) {
            log.warn("Failed to parse user profile cache for {}", userUid, exception);
            redisTemplate.delete(cacheKey);
            return Optional.empty();
        }
    }

    public Map<String, UserProfileVO> getBatch(Collection<String> userUids) {
        if (CollectionUtils.isEmpty(userUids)) {
            return Collections.emptyMap();
        }
        Set<String> distinctUids = userUids.stream().collect(Collectors.toSet());
        List<String> uidList = new ArrayList<>(distinctUids);
        List<String> keys = uidList.stream()
            .map(RedisKeyConstants::userProfileKey)
            .toList();
        List<String> values = redisTemplate.opsForValue().multiGet(keys);
        Map<String, UserProfileVO> result = new HashMap<>();
        if (values == null) {
            return result;
        }
        for (int i = 0; i < uidList.size(); i++) {
            String json = values.size() > i ? values.get(i) : null;
            if (json == null) {
                continue;
            }
            try {
                result.put(uidList.get(i), objectMapper.readValue(json, UserProfileVO.class));
            } catch (JsonProcessingException exception) {
                log.warn("Failed to parse user profile cache for {}", uidList.get(i), exception);
            }
        }
        return result;
    }

    public void put(UserProfileVO profile) {
        try {
            redisTemplate.opsForValue().set(
                RedisKeyConstants.userProfileKey(profile.getUserUid()),
                objectMapper.writeValueAsString(profile),
                PROFILE_TTL
            );
        } catch (JsonProcessingException exception) {
            log.warn("Failed to serialize user profile for {}", profile.getUserUid(), exception);
        }
    }

    public void putAll(Collection<UserProfileVO> profiles) {
        if (CollectionUtils.isEmpty(profiles)) {
            return;
        }
        profiles.forEach(this::put);
    }

    public void evict(String userUid) {
        redisTemplate.delete(RedisKeyConstants.userProfileKey(userUid));
    }
}
