package com.hidechat.websocket.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RealtimeEnvelopeDTO {

    private String type;
    private String requestId;
    private Long timestamp;
    private String traceId;
    private JsonNode data;

    public RealtimeEnvelopeTypeEnum resolveType() {
        return RealtimeEnvelopeTypeEnum.fromWireType(type);
    }
}
