package com.hidechat.modules.conversation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.service.ConversationService;
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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationServiceImpl implements ConversationService {

    private static final String PREVIEW_STRATEGY_MASKED = "masked";
    private static final String ONLINE_STATUS_RECENTLY_ACTIVE = "recently_active";
    private static final String ONLINE_STATUS_TEXT = "工作日 09:00 - 22:00 活跃";

    private final ImConversationMapper conversationMapper;
    private final ImContactMapper contactMapper;
    private final ImUnreadCounterMapper unreadCounterMapper;
    private final UserService userService;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    public ConversationServiceImpl(ImConversationMapper conversationMapper,
                                   ImContactMapper contactMapper,
                                   ImUnreadCounterMapper unreadCounterMapper,
                                   UserService userService,
                                   IdGenerator idGenerator,
                                   RandomValueGenerator randomValueGenerator,
                                   Clock clock) {
        this.conversationMapper = conversationMapper;
        this.contactMapper = contactMapper;
        this.unreadCounterMapper = unreadCounterMapper;
        this.userService = userService;
        this.idGenerator = idGenerator;
        this.randomValueGenerator = randomValueGenerator;
        this.clock = clock;
    }

    @Override
    @Transactional
    public ConversationItemVO createSingleConversation(String userUid, CreateSingleConversationRequest request) {
        validatePeer(userUid, request.getPeerUid());
        ParticipantPair pair = orderParticipants(userUid, request.getPeerUid());
        ImConversationEntity entity = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getUserAUid, pair.userA())
            .eq(ImConversationEntity::getUserBUid, pair.userB()));
        if (entity == null) {
            entity = createConversationEntity(pair);
        }
        return buildConversationItem(Collections.singletonList(entity), userUid).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationItemVO> listConversations(String userUid) {
        List<ImConversationEntity> conversations = conversationMapper.selectList(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getUserAUid, userUid)
            .or()
            .eq(ImConversationEntity::getUserBUid, userUid)
            .orderByDesc(ImConversationEntity::getUpdatedAt));
        return buildConversationItem(conversations, userUid);
    }

    @Override
    @Transactional
    public void clearUnread(String userUid, ClearUnreadRequest request) {
        ImConversationEntity conversation = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getConversationId, request.getConversationId()));
        if (conversation == null) {
            throw new BusinessException(420102, "会话不存在");
        }
        if (!Objects.equals(conversation.getUserAUid(), userUid)
            && !Objects.equals(conversation.getUserBUid(), userUid)) {
            throw new BusinessException(403001, "无权限访问");
        }
        ImUnreadCounterEntity counter = unreadCounterMapper.selectOne(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, userUid)
            .eq(ImUnreadCounterEntity::getConversationId, request.getConversationId()));
        LocalDateTime now = LocalDateTime.now(clock);
        if (counter == null) {
            counter = new ImUnreadCounterEntity();
            counter.setId(idGenerator.nextId());
            counter.setOwnerUid(userUid);
            counter.setConversationId(request.getConversationId());
            counter.setUnreadCount(0);
            counter.setUpdatedAt(now);
            unreadCounterMapper.insert(counter);
        } else {
            counter.setUnreadCount(0);
            counter.setUpdatedAt(now);
            unreadCounterMapper.updateById(counter);
        }
    }

    private void validatePeer(String userUid, String peerUid) {
        if (Objects.equals(userUid, peerUid)) {
            throw new BusinessException(400001, "不能与自己创建会话");
        }
        userService.getUserProfile(peerUid);
    }

    private ImConversationEntity createConversationEntity(ParticipantPair pair) {
        LocalDateTime now = LocalDateTime.now(clock);
        ImConversationEntity entity = new ImConversationEntity();
        entity.setId(idGenerator.nextId());
        entity.setConversationId(randomValueGenerator.conversationId());
        entity.setUserAUid(pair.userA());
        entity.setUserBUid(pair.userB());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        conversationMapper.insert(entity);
        return entity;
    }

    private ParticipantPair orderParticipants(String userUid, String peerUid) {
        // 1V1 会话固定按 UID 排序，避免 A->B 和 B->A 两次建链生成重复会话。
        if (userUid.compareTo(peerUid) <= 0) {
            return new ParticipantPair(userUid, peerUid);
        }
        return new ParticipantPair(peerUid, userUid);
    }

    private List<ConversationItemVO> buildConversationItem(List<ImConversationEntity> conversations, String ownerUid) {
        if (conversations.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> peerUids = conversations.stream()
            .map(conversation -> resolvePeerUid(conversation, ownerUid))
            .collect(Collectors.toSet());
        Map<String, UserProfileVO> peerProfiles = userService.getUserProfiles(peerUids);
        Map<String, ImContactEntity> contactMap = loadContactMap(ownerUid, peerUids);
        Map<String, ImUnreadCounterEntity> unreadMap = loadUnreadCounters(ownerUid, conversations);
        ZoneId zoneId = clock.getZone();
        return conversations.stream()
            .map(conversation -> {
                String peerUid = resolvePeerUid(conversation, ownerUid);
                UserProfileVO profile = peerProfiles.get(peerUid);
                ImContactEntity contact = contactMap.get(peerUid);
                ImUnreadCounterEntity counter = unreadMap.get(conversation.getConversationId());
                ConversationItemVO vo = new ConversationItemVO();
                vo.setConversationId(conversation.getConversationId());
                vo.setPeerUid(peerUid);
                if (profile != null) {
                    vo.setDisplayUserId(profile.getDisplayUserId());
                    vo.setPeerNickname(profile.getNickname());
                    vo.setPeerAvatar(profile.getAvatarUrl());
                    vo.setRemarkName(profile.getNickname());
                }
                if (contact != null) {
                    vo.setRemarkName(contact.getRemarkName());
                    vo.setPinned(Boolean.TRUE.equals(contact.getPinned()));
                } else {
                    vo.setPinned(Boolean.FALSE);
                }
                // 列表页默认只暴露脱敏预览，防止在未进入会话前把真实消息内容直接暴露在外层界面。
                vo.setPreviewStrategy(PREVIEW_STRATEGY_MASKED);
                vo.setLastMessagePreview(maskPreview(conversation.getLastMessageType(), conversation.getLastMessagePreview()));
                vo.setLastMessageType(conversation.getLastMessageType());
                vo.setLastMessageAt(conversation.getLastMessageAt() == null ? null
                    : conversation.getLastMessageAt().atZone(zoneId).toInstant().toEpochMilli());
                vo.setUnreadCount(counter == null ? 0 : counter.getUnreadCount());
                vo.setOnlineStatus(ONLINE_STATUS_RECENTLY_ACTIVE);
                vo.setOnlineStatusText(ONLINE_STATUS_TEXT);
                if (vo.getUnreadCount() == null) {
                    vo.setUnreadCount(0);
                }
                if (vo.getPinned() == null) {
                    vo.setPinned(Boolean.FALSE);
                }
                return vo;
            })
            .collect(Collectors.toList());
    }

    private String maskPreview(String lastMessageType, String lastMessagePreview) {
        if ("image".equals(lastMessageType)) {
            return "[图片消息]";
        }
        if ("file".equals(lastMessageType)) {
            return "[文件消息]";
        }
        if ("text".equals(lastMessageType) || "system".equals(lastMessageType)) {
            return "[文本消息]";
        }
        if ("[图片消息]".equals(lastMessagePreview)
            || "[文件消息]".equals(lastMessagePreview)
            || "[文本消息]".equals(lastMessagePreview)) {
            return lastMessagePreview;
        }
        return "[文本消息]";
    }

    private Map<String, ImContactEntity> loadContactMap(String ownerUid, Collection<String> peerUids) {
        if (peerUids.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ImContactEntity> contacts = contactMapper.selectList(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .in(ImContactEntity::getPeerUid, peerUids));
        return contacts.stream()
            .collect(Collectors.toMap(ImContactEntity::getPeerUid, contact -> contact, (a, b) -> a));
    }

    private Map<String, ImUnreadCounterEntity> loadUnreadCounters(String ownerUid,
                                                                  Collection<ImConversationEntity> conversations) {
        Set<String> conversationIds = conversations.stream()
            .map(ImConversationEntity::getConversationId)
            .collect(Collectors.toSet());
        if (conversationIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ImUnreadCounterEntity> counters = unreadCounterMapper.selectList(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, ownerUid)
            .in(ImUnreadCounterEntity::getConversationId, conversationIds));
        return counters.stream()
            .collect(Collectors.toMap(ImUnreadCounterEntity::getConversationId, counter -> counter, (a, b) -> a));
    }

    private String resolvePeerUid(ImConversationEntity conversation, String ownerUid) {
        if (Objects.equals(conversation.getUserAUid(), ownerUid)) {
            return conversation.getUserBUid();
        }
        return conversation.getUserAUid();
    }

    private record ParticipantPair(String userA, String userB) {
        public String userA() {
            return userA;
        }

        public String userB() {
            return userB;
        }
    }
}
