package com.hidechat.chat;

import com.hidechat.friend.FriendService;
import com.hidechat.security.AuthInterceptor;
import com.hidechat.user.User;
import com.hidechat.user.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {
    private final ChatService chat;
    private final FriendService friends;
    private final com.hidechat.config.AppConfig cfg;

    public ChatController(ChatService chat, FriendService friends, com.hidechat.config.AppConfig cfg) {
        this.chat = chat;
        this.friends = friends;
        this.cfg = cfg;
    }

    private static long me(HttpServletRequest http) {
        return ((User) http.getAttribute(AuthInterceptor.ATTR_USER)).getId();
    }

    /** 全量同步（设计 6.4：登录/重连后调用） */
    @GetMapping("/init")
    public Map<String, Object> init(HttpServletRequest http) {
        long uid = me(http);
        User u = (User) http.getAttribute(AuthInterceptor.ATTR_USER);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("me", UserDto.of(u));
        out.put("friends", friends.friendsOf(uid));
        out.put("pending_requests", friends.incomingRequests(uid));
        out.put("conversations", chat.conversationList(uid));
        out.put("ttl_minutes", cfg.msgTtlMinutes());
        out.put("recall_minutes", cfg.recallWindowMinutes());
        return out;
    }

    @GetMapping("/conversations")
    public List<Map<String, Object>> conversations(HttpServletRequest http) {
        return chat.conversationList(me(http));
    }

    /** 从通讯录发起：取或创建与好友的会话 */
    @GetMapping("/conv-with/{friendId}")
    public java.util.Map<String, Object> convWith(HttpServletRequest http, @PathVariable long friendId) {
        return chat.convWith(me(http), friendId);
    }

    @GetMapping("/conversations/{convId}/messages")
    public List<Map<String, Object>> messages(HttpServletRequest http,
                                              @PathVariable long convId,
                                              @RequestParam(required = false) Long before_id,
                                              @RequestParam(defaultValue = "50") int limit) {
        return chat.messagePage(me(http), convId, before_id, Math.min(Math.max(limit, 1), 100));
    }
}