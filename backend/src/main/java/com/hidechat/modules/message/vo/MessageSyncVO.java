package com.hidechat.modules.message.vo;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageSyncVO {

    private List<MessageItemVO> messages;
    private String nextCursor;
    private boolean hasMore;
}
