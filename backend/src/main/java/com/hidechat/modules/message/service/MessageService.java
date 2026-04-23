package com.hidechat.modules.message.service;

import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
import com.hidechat.modules.message.vo.MessageSyncVO;
import java.util.List;

public interface MessageService {

    MessageItemVO sendMessage(String userUid, SendMessageRequest request);

    MessageHistoryVO listHistory(String userUid, String conversationId, String cursor, Integer pageSize);

    MessageSyncVO listIncrementalMessages(String userUid, String sinceCursor, List<String> conversationIds, Integer pageSize);

    void markMessagesRead(String userUid, MarkMessageReadRequest request);
}
