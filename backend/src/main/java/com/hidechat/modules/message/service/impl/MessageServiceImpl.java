package com.hidechat.modules.message.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImMessageEntity;
import com.hidechat.persistence.entity.ImMessageReadReceiptEntity;
import com.hidechat.persistence.entity.ImUnreadCounterEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImMessageMapper;
import com.hidechat.persistence.mapper.ImMessageReadReceiptMapper;
import com.hidechat.persistence.mapper.ImUnreadCounterMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MessageServiceImpl implements MessageService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final ImMessageMapper messageMapper;
    private final ImConversationMapper conversationMapper;
    private final ImMessageReadReceiptMapper readReceiptMapper;
    private final ImUnreadCounterMapper unreadCounterMapper;
    private final ImContactMapper contactMapper;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final Clock clock;

    public MessageServiceImpl(ImMessageMapper messageMapper,
                              ImConversationMapper conversationMapper,
                              ImMessageReadReceiptMapper readReceiptMapper,
                              ImUnreadCounterMapper unreadCounterMapper,
                              ImContactMapper contactMapper,
                              IdGenerator idGenerator,
                              RandomValueGenerator randomValueGenerator,
                              Clock clock) {
        this.messageMapper = messageMapper;
        this.conversationMapper = conversationMapper;
        this.readReceiptMapper = readReceiptMapper;
        this.unreadCounterMapper = unreadCounterMapper;
        this.contactMapper = contactMapper;
        this.idGenerator = idGenerator;
        this.randomValueGenerator = randomValueGenerator;
        this.clock = clock;
    }

    @Override
    @Transactional
    public MessageItemVO sendMessage(String userUid, SendMessageRequest request) {
        ImConversationEntity conversation = requireConversationMember(request.getConversationId(), userUid);
        String peerUid = resolvePeerUid(conversation, userUid);
        if (!Objects.equals(peerUid, request.getReceiverUid())) {
            throw new BusinessException(420201, "接收方不属于当前会话");
        }
        validateMessageRequest(request);

        LocalDateTime now = LocalDateTime.now(clock);
        ImMessageEntity entity = new ImMessageEntity();
        entity.setId(idGenerator.nextId());
        entity.setMessageId(StringUtils.hasText(request.getMessageId())
            ? request.getMessageId()
            : randomValueGenerator.messageId());
        entity.setConversationId(request.getConversationId());
        entity.setSenderUid(userUid);
        entity.setReceiverUid(request.getReceiverUid());
        entity.setMessageType(request.getMessageType());
        entity.setPayloadType(request.getPayloadType());
        entity.setPayload(request.getPayload());
        entity.setFileId(request.getFileId());
        entity.setServerStatus("delivered");
        entity.setClientMsgTime(request.getClientMsgTime());
        entity.setServerMsgTime(now);
        entity.setDeleted(Boolean.FALSE);
        messageMapper.insert(entity);

        updateConversationAfterMessage(conversation, entity, now);
        touchContacts(userUid, request.getReceiverUid(), now);
        incrementUnreadCounter(request.getReceiverUid(), request.getConversationId(), now);
        return toMessageItem(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public MessageHistoryVO listHistory(String userUid, String conversationId, String cursor, Integer pageSize) {
        requireConversationMember(conversationId, userUid);
        int normalizedPageSize = normalizePageSize(pageSize);
        LambdaQueryWrapper<ImMessageEntity> queryWrapper = new LambdaQueryWrapper<ImMessageEntity>()
            .eq(ImMessageEntity::getConversationId, conversationId)
            .eq(ImMessageEntity::getDeleted, Boolean.FALSE);
        if (StringUtils.hasText(cursor)) {
            queryWrapper.lt(ImMessageEntity::getServerMsgTime, parseCursor(cursor));
        }
        queryWrapper.orderByDesc(ImMessageEntity::getServerMsgTime)
            .orderByDesc(ImMessageEntity::getId)
            .last("limit " + (normalizedPageSize + 1));
        List<ImMessageEntity> messages = messageMapper.selectList(queryWrapper);

        boolean hasMore = messages.size() > normalizedPageSize;
        if (hasMore) {
            messages = new ArrayList<>(messages.subList(0, normalizedPageSize));
        }
        messages.sort(Comparator.comparing(ImMessageEntity::getServerMsgTime).thenComparing(ImMessageEntity::getId));

        MessageHistoryVO historyVO = new MessageHistoryVO();
        historyVO.setList(messages.stream().map(this::toMessageItem).toList());
        historyVO.setHasMore(hasMore);
        historyVO.setNextCursor(hasMore && !messages.isEmpty()
            ? String.valueOf(toEpochMilli(messages.get(0).getServerMsgTime()))
            : null);
        return historyVO;
    }

    @Override
    @Transactional
    public void markMessagesRead(String userUid, MarkMessageReadRequest request) {
        requireConversationMember(request.getConversationId(), userUid);
        List<String> requestedIds = request.getMessageIds() == null
            ? Collections.emptyList()
            : request.getMessageIds().stream().filter(StringUtils::hasText).distinct().toList();
        if (!requestedIds.isEmpty()) {
            List<ImMessageEntity> messages = messageMapper.selectList(new LambdaQueryWrapper<ImMessageEntity>()
                .eq(ImMessageEntity::getConversationId, request.getConversationId())
                .eq(ImMessageEntity::getReceiverUid, userUid)
                .eq(ImMessageEntity::getDeleted, Boolean.FALSE)
                .in(ImMessageEntity::getMessageId, requestedIds));
            if (messages.size() != requestedIds.size()) {
                throw new BusinessException(420202, "消息不存在或无权限读取");
            }
            LocalDateTime now = LocalDateTime.now(clock);
            for (ImMessageEntity message : messages) {
                upsertReadReceipt(userUid, message.getMessageId(), now);
                if (!Objects.equals("read", message.getServerStatus())) {
                    message.setServerStatus("read");
                    messageMapper.updateById(message);
                }
            }
        }
        refreshUnreadCounter(userUid, request.getConversationId(), LocalDateTime.now(clock));
    }

    private void validateMessageRequest(SendMessageRequest request) {
        if (!List.of("text", "image", "system").contains(request.getMessageType())) {
            throw new BusinessException(400001, "消息类型不支持");
        }
        if (!List.of("plain", "ref", "encrypted").contains(request.getPayloadType())) {
            throw new BusinessException(400001, "消息负载类型不支持");
        }
        if ("image".equals(request.getMessageType()) && !StringUtils.hasText(request.getFileId())) {
            throw new BusinessException(400001, "图片消息必须关联文件");
        }
        if ("text".equals(request.getMessageType()) && !StringUtils.hasText(request.getPayload())) {
            throw new BusinessException(400001, "文本消息内容不能为空");
        }
    }

    private ImConversationEntity requireConversationMember(String conversationId, String userUid) {
        ImConversationEntity conversation = conversationMapper.selectOne(new LambdaQueryWrapper<ImConversationEntity>()
            .eq(ImConversationEntity::getConversationId, conversationId));
        if (conversation == null) {
            throw new BusinessException(420102, "会话不存在");
        }
        if (!Objects.equals(conversation.getUserAUid(), userUid)
            && !Objects.equals(conversation.getUserBUid(), userUid)) {
            throw new BusinessException(403001, "无权限访问");
        }
        return conversation;
    }

    private String resolvePeerUid(ImConversationEntity conversation, String userUid) {
        if (Objects.equals(conversation.getUserAUid(), userUid)) {
            return conversation.getUserBUid();
        }
        return conversation.getUserAUid();
    }

    private void updateConversationAfterMessage(ImConversationEntity conversation,
                                                ImMessageEntity message,
                                                LocalDateTime now) {
        conversation.setLastMessageId(message.getMessageId());
        conversation.setLastMessageType(message.getMessageType());
        conversation.setLastMessagePreview(buildPreview(message.getMessageType()));
        conversation.setLastMessageAt(now);
        conversation.setUpdatedAt(now);
        conversationMapper.updateById(conversation);
    }

    private void touchContacts(String senderUid, String receiverUid, LocalDateTime now) {
        touchContact(senderUid, receiverUid, now);
        touchContact(receiverUid, senderUid, now);
    }

    private void touchContact(String ownerUid, String peerUid, LocalDateTime now) {
        ImContactEntity contact = contactMapper.selectOne(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .eq(ImContactEntity::getPeerUid, peerUid));
        if (contact != null) {
            contact.setLastMessageAt(now);
            contact.setUpdatedAt(now);
            contactMapper.updateById(contact);
        }
    }

    private void incrementUnreadCounter(String ownerUid, String conversationId, LocalDateTime now) {
        ImUnreadCounterEntity counter = unreadCounterMapper.selectOne(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, ownerUid)
            .eq(ImUnreadCounterEntity::getConversationId, conversationId));
        if (counter == null) {
            counter = new ImUnreadCounterEntity();
            counter.setId(idGenerator.nextId());
            counter.setOwnerUid(ownerUid);
            counter.setConversationId(conversationId);
            counter.setUnreadCount(1);
            counter.setUpdatedAt(now);
            unreadCounterMapper.insert(counter);
            return;
        }
        counter.setUnreadCount(counter.getUnreadCount() == null ? 1 : counter.getUnreadCount() + 1);
        counter.setUpdatedAt(now);
        unreadCounterMapper.updateById(counter);
    }

    private void upsertReadReceipt(String readerUid, String messageId, LocalDateTime now) {
        ImMessageReadReceiptEntity receipt = readReceiptMapper.selectOne(new LambdaQueryWrapper<ImMessageReadReceiptEntity>()
            .eq(ImMessageReadReceiptEntity::getMessageId, messageId)
            .eq(ImMessageReadReceiptEntity::getReaderUid, readerUid));
        if (receipt != null) {
            return;
        }
        receipt = new ImMessageReadReceiptEntity();
        receipt.setId(idGenerator.nextId());
        receipt.setMessageId(messageId);
        receipt.setReaderUid(readerUid);
        receipt.setReadAt(now);
        readReceiptMapper.insert(receipt);
    }

    private void refreshUnreadCounter(String ownerUid, String conversationId, LocalDateTime now) {
        Long unread = messageMapper.selectCount(new LambdaQueryWrapper<ImMessageEntity>()
            .eq(ImMessageEntity::getConversationId, conversationId)
            .eq(ImMessageEntity::getReceiverUid, ownerUid)
            .eq(ImMessageEntity::getDeleted, Boolean.FALSE)
            .ne(ImMessageEntity::getServerStatus, "read"));
        ImUnreadCounterEntity counter = unreadCounterMapper.selectOne(new LambdaQueryWrapper<ImUnreadCounterEntity>()
            .eq(ImUnreadCounterEntity::getOwnerUid, ownerUid)
            .eq(ImUnreadCounterEntity::getConversationId, conversationId));
        int unreadCount = unread == null ? 0 : unread.intValue();
        if (counter == null) {
            counter = new ImUnreadCounterEntity();
            counter.setId(idGenerator.nextId());
            counter.setOwnerUid(ownerUid);
            counter.setConversationId(conversationId);
            counter.setUnreadCount(unreadCount);
            counter.setUpdatedAt(now);
            unreadCounterMapper.insert(counter);
            return;
        }
        counter.setUnreadCount(unreadCount);
        counter.setUpdatedAt(now);
        unreadCounterMapper.updateById(counter);
    }

    private MessageItemVO toMessageItem(ImMessageEntity entity) {
        MessageItemVO vo = new MessageItemVO();
        vo.setMessageId(entity.getMessageId());
        vo.setConversationId(entity.getConversationId());
        vo.setSenderUid(entity.getSenderUid());
        vo.setReceiverUid(entity.getReceiverUid());
        vo.setMessageType(entity.getMessageType());
        vo.setPayloadType(entity.getPayloadType());
        vo.setPayload(entity.getPayload());
        vo.setFileId(entity.getFileId());
        vo.setClientMsgTime(entity.getClientMsgTime());
        vo.setServerMsgTime(toEpochMilli(entity.getServerMsgTime()));
        vo.setServerStatus(entity.getServerStatus());
        return vo;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private LocalDateTime parseCursor(String cursor) {
        try {
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(Long.parseLong(cursor)), clock.getZone());
        } catch (RuntimeException ex) {
            throw new BusinessException(400001, "消息游标不合法");
        }
    }

    private long toEpochMilli(LocalDateTime time) {
        return time.atZone(clock.getZone()).toInstant().toEpochMilli();
    }

    private String buildPreview(String messageType) {
        return switch (messageType) {
            case "image" -> "[图片消息]";
            case "system" -> "[系统消息]";
            default -> "[文本消息]";
        };
    }
}
