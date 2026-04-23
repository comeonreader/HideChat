package com.hidechat.websocket.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SyncRequestPayloadDTO {

    private String sinceCursor;
    private List<String> conversationIds;
    private Integer pageSize;
}
