package com.hidechat.friend;

import com.hidechat.security.AuthInterceptor;
import com.hidechat.user.User;
import com.hidechat.user.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FriendController {
    private final FriendService service;

    public FriendController(FriendService service) {
        this.service = service;
    }

    private static long me(HttpServletRequest http) {
        return ((User) http.getAttribute(AuthInterceptor.ATTR_USER)).getId();
    }

    @GetMapping("/users/search")
    public List<Map<String, Object>> search(HttpServletRequest http,
                                            @RequestParam(defaultValue = "") String q,
                                            @RequestParam(defaultValue = "20") int limit) {
        return service.search(me(http), q, Math.min(Math.max(limit, 1), 50));
    }

    @GetMapping("/friends")
    public List<Map<String, Object>> friends(HttpServletRequest http) {
        List<UserDto> fs = service.friendsOf(me(http));
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (UserDto f : fs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("user", f);
            out.add(m);
        }
        return out;
    }

    @PostMapping("/friend-requests")
    public Map<String, Object> sendRequest(HttpServletRequest http,
                                           @RequestBody Map<String, Object> body) {
        long toId = ((Number) body.get("to_user_id")).longValue();
        String message = body.get("message") == null ? "" : body.get("message").toString();
        return service.sendRequest(me(http), toId, message);
    }

    @GetMapping("/friend-requests")
    public List<Map<String, Object>> incoming(HttpServletRequest http) {
        return service.incomingRequests(me(http));
    }

    @PostMapping("/friend-requests/{id}/accept")
    public Map<String, Object> accept(HttpServletRequest http, @PathVariable long id) {
        return service.accept(id, me(http));
    }

    @PostMapping("/friend-requests/{id}/reject")
    public Map<String, Object> reject(HttpServletRequest http, @PathVariable long id) {
        return service.reject(id, me(http));
    }

    @DeleteMapping("/friend-requests/{id}")
    public void withdraw(HttpServletRequest http, @PathVariable long id) {
        service.withdraw(id, me(http));
    }

    @DeleteMapping("/friends/{user_id}")
    public void deleteFriend(HttpServletRequest http, @PathVariable("user_id") long friendId) {
        service.deleteFriend(me(http), friendId);
    }
}
