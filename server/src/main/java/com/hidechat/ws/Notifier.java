package com.hidechat.ws;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/** 服务层向在线端推送事件的统一出口 */
@Component
public class Notifier {
    private final SessionRegistry registry;

    public Notifier(SessionRegistry registry) {
        this.registry = registry;
    }

    public Map<String, Object> frame(String type) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type);
        return m;
    }

    /** 推给该用户全部在线端；返回是否至少一端收到 */
    public boolean toUser(long userId, Map<String, Object> payload) {
        return registry.sendToUser(userId, payload);
    }
}
