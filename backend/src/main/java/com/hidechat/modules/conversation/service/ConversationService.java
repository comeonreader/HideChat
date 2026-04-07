package com.hidechat.modules.conversation.service;

import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.vo.ConversationItemVO;
import java.util.List;

public interface ConversationService {

    ConversationItemVO createSingleConversation(String userUid, CreateSingleConversationRequest request);

    List<ConversationItemVO> listConversations(String userUid);

    void clearUnread(String userUid, ClearUnreadRequest request);
}
