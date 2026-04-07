package com.hidechat.modules.contact.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.modules.contact.service.ContactService;
import com.hidechat.modules.contact.vo.ContactItemVO;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ContactServiceImpl implements ContactService {

    private final ImContactMapper contactMapper;
    private final ImUserMapper userMapper;
    private final IdGenerator idGenerator;
    private final UserService userService;
    private final Clock clock;

    public ContactServiceImpl(ImContactMapper contactMapper,
                              ImUserMapper userMapper,
                              IdGenerator idGenerator,
                              UserService userService,
                              Clock clock) {
        this.contactMapper = contactMapper;
        this.userMapper = userMapper;
        this.idGenerator = idGenerator;
        this.userService = userService;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void addContact(String ownerUid, AddContactRequest request) {
        if (Objects.equals(ownerUid, request.getPeerUid())) {
            throw new BusinessException(400001, "不能添加自己为联系人");
        }
        ImUserEntity peer = userMapper.selectOne(new LambdaQueryWrapper<ImUserEntity>()
            .eq(ImUserEntity::getUserUid, request.getPeerUid()));
        if (peer == null) {
            throw new BusinessException(404001, "联系人不存在");
        }
        LocalDateTime now = LocalDateTime.now(clock);
        ImContactEntity existing = contactMapper.selectOne(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .eq(ImContactEntity::getPeerUid, request.getPeerUid()));
        if (existing != null) {
            if (StringUtils.hasText(request.getRemarkName())
                && !Objects.equals(request.getRemarkName(), existing.getRemarkName())) {
                existing.setRemarkName(request.getRemarkName());
                existing.setUpdatedAt(now);
                contactMapper.updateById(existing);
            }
            return;
        }
        ImContactEntity entity = new ImContactEntity();
        entity.setId(idGenerator.nextId());
        entity.setOwnerUid(ownerUid);
        entity.setPeerUid(request.getPeerUid());
        entity.setRemarkName(request.getRemarkName());
        entity.setPinned(Boolean.FALSE);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        contactMapper.insert(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactItemVO> listContacts(String ownerUid) {
        List<ImContactEntity> contacts = contactMapper.selectList(new LambdaQueryWrapper<ImContactEntity>()
            .eq(ImContactEntity::getOwnerUid, ownerUid)
            .orderByDesc(ImContactEntity::getPinned)
            .orderByDesc(ImContactEntity::getLastMessageAt)
            .orderByDesc(ImContactEntity::getId));
        Set<String> peerUids = contacts.stream()
            .map(ImContactEntity::getPeerUid)
            .collect(Collectors.toSet());
        Map<String, UserProfileVO> peerProfiles = userService.getUserProfiles(peerUids);
        ZoneId zoneId = clock.getZone();
        return contacts.stream()
            .map(contact -> {
                UserProfileVO profile = peerProfiles.get(contact.getPeerUid());
                ContactItemVO vo = new ContactItemVO();
                vo.setPeerUid(contact.getPeerUid());
                if (profile != null) {
                    vo.setPeerNickname(profile.getNickname());
                    vo.setPeerAvatar(profile.getAvatarUrl());
                }
                vo.setRemarkName(contact.getRemarkName());
                vo.setPinned(Boolean.TRUE.equals(contact.getPinned()));
                vo.setLastMessageAt(contact.getLastMessageAt() == null ? null
                    : contact.getLastMessageAt().atZone(zoneId).toInstant().toEpochMilli());
                return vo;
            })
            .collect(Collectors.toList());
    }
}
