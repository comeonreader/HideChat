package com.hidechat.modules.contact.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.modules.contact.service.ContactService;
import com.hidechat.modules.contact.vo.ContactItemVO;
import com.hidechat.modules.contact.vo.RecentContactItemVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/add")
    public ApiResponse<Void> addContact(@Valid @RequestBody AddContactRequest request) {
        contactService.addContact(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }

    @GetMapping("/list")
    public ApiResponse<List<ContactItemVO>> listContacts() {
        return ApiResponse.success(contactService.listContacts(currentUserProvider.getRequiredUserUid()));
    }

    @GetMapping("/recent")
    public ApiResponse<List<RecentContactItemVO>> listRecentContacts(@org.springframework.web.bind.annotation.RequestParam(required = false) Integer limit) {
        return ApiResponse.success(contactService.listRecentContacts(currentUserProvider.getRequiredUserUid(), limit));
    }
}
