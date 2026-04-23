package com.hidechat.websocket.dto;

import java.util.Locale;

public enum RealtimeEnvelopeTypeEnum {

    AUTH("auth"),
    AUTH_OK("auth_ok"),
    PING("ping"),
    PONG("pong"),
    MESSAGE_SEND("message_send"),
    MESSAGE_ACK("message_ack"),
    MESSAGE_RECEIVE("message_receive"),
    MESSAGE_READ("message_read"),
    SYNC_REQUEST("sync_request"),
    SYNC_RESPONSE("sync_response"),
    ERROR("error"),
    UNKNOWN("unknown");

    private final String wireType;

    RealtimeEnvelopeTypeEnum(String wireType) {
        this.wireType = wireType;
    }

    public String getWireType() {
        return wireType;
    }

    public static RealtimeEnvelopeTypeEnum fromWireType(String rawType) {
        if (rawType == null) {
            return UNKNOWN;
        }
        String normalized = rawType.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "auth" -> AUTH;
            case "auth_ok" -> AUTH_OK;
            case "ping" -> PING;
            case "pong" -> PONG;
            case "message_send", "chat_send" -> MESSAGE_SEND;
            case "message_ack", "chat_ack" -> MESSAGE_ACK;
            case "message_receive", "chat_receive" -> MESSAGE_RECEIVE;
            case "message_read", "chat_read" -> MESSAGE_READ;
            case "sync_request" -> SYNC_REQUEST;
            case "sync_response" -> SYNC_RESPONSE;
            case "error", "chat_error" -> ERROR;
            default -> UNKNOWN;
        };
    }
}
