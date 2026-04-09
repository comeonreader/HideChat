package com.hidechat.modules.message.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/send")
    public ApiResponse<MessageItemVO> send(@Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.success(messageService.sendMessage(currentUserProvider.getRequiredUserUid(), request));
    }

    @GetMapping("/history")
    public ApiResponse<MessageHistoryVO> history(@RequestParam String conversationId,
                                                 @RequestParam(required = false) String cursor,
                                                 @RequestParam(required = false) Integer pageSize) {
        return ApiResponse.success(messageService.listHistory(
            currentUserProvider.getRequiredUserUid(),
            conversationId,
            cursor,
            pageSize
        ));
    }

    @PostMapping("/read")
    public ApiResponse<Void> read(@Valid @RequestBody MarkMessageReadRequest request) {
        messageService.markMessagesRead(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }
}
