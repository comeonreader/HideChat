package com.hidechat.modules.message.service;

import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;

public interface MessageService {

    MessageItemVO sendMessage(String userUid, SendMessageRequest request);

    MessageHistoryVO listHistory(String userUid, String conversationId, String cursor, Integer pageSize);

    void markMessagesRead(String userUid, MarkMessageReadRequest request);
}
