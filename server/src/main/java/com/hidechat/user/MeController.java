package com.hidechat.user;

import com.hidechat.security.AuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class MeController {
    private final AvatarService avatar;

    public MeController(AvatarService avatar) {
        this.avatar = avatar;
    }

    private static User me(HttpServletRequest http) {
        return (User) http.getAttribute(AuthInterceptor.ATTR_USER);
    }

    @GetMapping
    public UserDto get(HttpServletRequest http) {
        return UserDto.of(me(http));
    }

    @PutMapping
    public Map<String, Object> update(HttpServletRequest http, @RequestBody Map<String, Object> body) {
        String nickname = body.get("nickname") == null ? null : body.get("nickname").toString();
        return avatar.updateNickname(me(http), nickname);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadAvatar(HttpServletRequest http, @RequestParam("file") MultipartFile file) {
        return avatar.upload(me(http), file);
    }

    @DeleteMapping("/avatar")
    public void deleteAvatar(HttpServletRequest http) {
        avatar.remove(me(http));
    }
}
