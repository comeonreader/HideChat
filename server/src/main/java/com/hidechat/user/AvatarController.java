package com.hidechat.user;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.util.Map;

/** 头像公开只读（设计 8.5：仅头像/昵称在加好友前可见，?v=N 强缓存） */
@RestController
@RequestMapping("/api/avatars")
public class AvatarController {
    private final UserRepository users;
    private final AvatarService avatar;

    public AvatarController(UserRepository users, AvatarService avatar) {
        this.users = users;
        this.avatar = avatar;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Resource> get(@PathVariable long userId) {
        User u = users.findById(userId).orElse(null);
        if (u == null || u.getAvatarExt() == null) {
            return ResponseEntity.notFound().build();
        }
        String ext = u.getAvatarExt();
        var file = avatar.fileOf(userId, ext);
        if (!Files.exists(file)) {
            return ResponseEntity.notFound().build();
        }
        MediaType type = switch (ext) {
            case "png" -> MediaType.IMAGE_PNG;
            case "webp" -> MediaType.parseMediaType("image/webp");
            default -> MediaType.IMAGE_JPEG;
        };
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.noCache().mustRevalidate()) // 交由 ?v= 控制刷新
                .header(HttpHeaders.ETAG, String.valueOf(u.getAvatarVersion()))
                .body(new FileSystemResource(file.toFile()));
    }
}