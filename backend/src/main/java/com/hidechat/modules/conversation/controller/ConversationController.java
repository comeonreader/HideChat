package com.hidechat.modules.conversation.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.service.ConversationService;
import com.hidechat.modules.conversation.vo.ConversationItemVO;
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
@RequestMapping("/api/conversation")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/single")
    public ApiResponse<ConversationItemVO> createSingle(@Valid @RequestBody CreateSingleConversationRequest request) {
        return ApiResponse.success(conversationService.createSingleConversation(
            currentUserProvider.getRequiredUserUid(),
            request
        ));
    }

    @GetMapping("/list")
    public ApiResponse<List<ConversationItemVO>> list() {
        return ApiResponse.success(conversationService.listConversations(currentUserProvider.getRequiredUserUid()));
    }

    @PostMapping("/clear-unread")
    public ApiResponse<Void> clearUnread(@Valid @RequestBody ClearUnreadRequest request) {
        conversationService.clearUnread(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }
}
