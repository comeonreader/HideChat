package com.hidechat.modules.contact.service;

import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.modules.contact.vo.ContactItemVO;
import java.util.List;

public interface ContactService {

    void addContact(String ownerUid, AddContactRequest request);

    List<ContactItemVO> listContacts(String ownerUid);
}
