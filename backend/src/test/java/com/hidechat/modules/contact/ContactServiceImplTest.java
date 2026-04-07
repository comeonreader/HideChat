package com.hidechat.modules.contact;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.modules.contact.service.impl.ContactServiceImpl;
import com.hidechat.modules.contact.vo.ContactItemVO;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.persistence.entity.ImContactEntity;
import com.hidechat.persistence.entity.ImUserEntity;
import com.hidechat.persistence.mapper.ImContactMapper;
import com.hidechat.persistence.mapper.ImUserMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ContactServiceImplTest {

    @Mock
    private ImContactMapper contactMapper;

    @Mock
    private ImUserMapper userMapper;

    @Mock
    private UserService userService;

    private ContactServiceImpl contactService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-07T00:00:00Z"), ZoneOffset.UTC);
        contactService = new ContactServiceImpl(contactMapper, userMapper, new IdGenerator(), userService, clock);
    }

    @Test
    void shouldCreateNewContact() {
        when(userMapper.selectOne(any())).thenReturn(buildUser("u_1002"));
        when(contactMapper.selectOne(any())).thenReturn(null);

        AddContactRequest request = new AddContactRequest();
        request.setPeerUid("u_1002");
        request.setRemarkName("Bob");

        contactService.addContact("u_1001", request);

        verify(contactMapper).insert(any(ImContactEntity.class));
    }

    @Test
    void shouldUpdateExistingContactRemark() {
        when(userMapper.selectOne(any())).thenReturn(buildUser("u_1002"));
        ImContactEntity existing = new ImContactEntity();
        existing.setId(1L);
        existing.setOwnerUid("u_1001");
        existing.setPeerUid("u_1002");
        existing.setRemarkName("Old");
        when(contactMapper.selectOne(any())).thenReturn(existing);

        AddContactRequest request = new AddContactRequest();
        request.setPeerUid("u_1002");
        request.setRemarkName("Bob");

        contactService.addContact("u_1001", request);

        ArgumentCaptor<ImContactEntity> captor = ArgumentCaptor.forClass(ImContactEntity.class);
        verify(contactMapper).updateById(captor.capture());
        assertEquals("Bob", captor.getValue().getRemarkName());
    }

    @Test
    void shouldThrowWhenPeerMissing() {
        when(userMapper.selectOne(any())).thenReturn(null);

        AddContactRequest request = new AddContactRequest();
        request.setPeerUid("u_1002");

        assertThrows(BusinessException.class, () -> contactService.addContact("u_1001", request));
    }

    @Test
    void shouldListContacts() {
        ImContactEntity contact = new ImContactEntity();
        contact.setOwnerUid("u_1001");
        contact.setPeerUid("u_1002");
        when(contactMapper.selectList(any())).thenReturn(List.of(contact));
        UserProfileVO profile = new UserProfileVO();
        profile.setUserUid("u_1002");
        profile.setNickname("Bob");
        when(userService.getUserProfiles(any())).thenReturn(Map.of("u_1002", profile));

        List<ContactItemVO> result = contactService.listContacts("u_1001");

        assertEquals(1, result.size());
        assertEquals("u_1002", result.get(0).getPeerUid());
        assertEquals("Bob", result.get(0).getPeerNickname());
    }

    private ImUserEntity buildUser(String userUid) {
        ImUserEntity entity = new ImUserEntity();
        entity.setUserUid(userUid);
        return entity;
    }
}
