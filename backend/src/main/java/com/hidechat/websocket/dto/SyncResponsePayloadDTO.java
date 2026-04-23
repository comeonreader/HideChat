package com.hidechat.websocket.dto;

import com.hidechat.modules.message.vo.MessageItemVO;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SyncResponsePayloadDTO {

    private String nextCursor;
    private boolean hasMore;
    private List<MessageItemVO> messages;
}
