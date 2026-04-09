package com.hidechat.modules.message.vo;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageHistoryVO {

    private List<MessageItemVO> list;
    private String nextCursor;
    private boolean hasMore;
}
