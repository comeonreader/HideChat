package com.hidechat.media;

import com.hidechat.chat.MessageEntity;
import com.hidechat.chat.MessageRepository;
import com.hidechat.config.AppConfig;
import com.hidechat.error.ApiException;
import com.hidechat.media.MediaSniff.Type;
import com.hidechat.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaService {
    private static final Logger log = LoggerFactory.getLogger(MediaService.class);
    private final MessageRepository messages;
    private final AppConfig cfg;
    private final Path root;

    public MediaService(MessageRepository messages, AppConfig cfg) {
        this.messages = messages;
        this.cfg = cfg;
        this.root = Path.of(cfg.uploadDir());
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("无法创建上传目录 " + root, e);
        }
    }

    public Map<String, Object> upload(User me, String kind, MultipartFile file,
                                      Long width, Long height, Double duration) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("EMPTY_FILE", "文件为空");
        }
        long maxBytes = switch (kind == null ? "" : kind) {
            case "image" -> cfg.maxImageMb() * 1024 * 1024;
            case "video" -> cfg.maxVideoMb() * 1024 * 1024;
            case "voice" -> cfg.maxVoiceMb() * 1024 * 1024;
            default -> throw ApiException.badRequest("BAD_KIND", "kind 必须为 image/video/voice");
        };
        if (file.getSize() > maxBytes) {
            throw ApiException.badRequest("FILE_TOO_LARGE", "文件超过大小限制");
        }
        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(16);
        } catch (IOException e) {
            throw ApiException.badRequest("READ_FAILED", "读取文件失败");
        }
        Type t = MediaSniff.sniff(head);
        boolean ok = switch (kind) {
            case "image" -> t != null && t.name().startsWith("IMAGE_");
            case "video" -> t == Type.MP4 || t == Type.WEBM;
            case "voice" -> t == Type.MP4 || t == Type.WEBM || t == Type.OGG;
            default -> false;
        };
        if (!ok) {
            throw ApiException.badRequest("BAD_FILE_TYPE", "文件类型与 kind 不匹配（仅 jpg/png/webp/gif / mp4/webm / mp4/webm/ogg）");
        }
        if (kind.equals("voice") && duration != null && duration > 120) {
            throw ApiException.badRequest("TOO_LONG", "语音不能超过 120 秒");
        }
        String ext = MediaSniff.extOf(t);
        UUID key = UUID.randomUUID();
        Path target = root.resolve(key + "." + ext);
        Path tmp = null;
        try {
            tmp = Files.createTempFile(root, "up-", ".tmp");
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
            }
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("media save failed", e);
            if (tmp != null) { try { Files.deleteIfExists(tmp); } catch (IOException ignored) { } }
            throw ApiException.badRequest("SAVE_FAILED", "文件保存失败");
        }
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("size", file.getSize());
        meta.put("ext", ext);
        if (width != null) meta.put("width", width);
        if (height != null) meta.put("height", height);
        if (duration != null) meta.put("duration", duration);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("key", key.toString());
        out.put("meta", meta);
        return out;
    }

    public Path fileOf(String key, String ext) {
        return root.resolve(key + "." + ext);
    }

    /** 删除消息引用的媒体文件（清扫器/删好友调用） */
    public void deleteKeys(List<UUID> keys) {
        for (UUID k : keys) {
            // 消息未删时防误删：仍被引用则跳过
            if (messages.countByMediaKey(k) > 0) continue;
            try {
                try (var dir = Files.newDirectoryStream(root, k + ".*")) {
                    for (Path p : dir) Files.deleteIfExists(p);
                }
            } catch (IOException ignored) { }
        }
    }

    /** 每日孤儿清理：无消息引用且上传超过 24h（设计 4.4） */
    public void sweepOrphans() {
        long cutoff = System.currentTimeMillis() - 24 * 3600 * 1000L;
        List<MessageEntity> all = messages.findAllWithMedia();
        java.util.Set<String> used = new java.util.HashSet<>();
        for (MessageEntity m : all) {
            if (m.getMediaKey() != null) used.add(m.getMediaKey().toString());
        }
        try (var dir = Files.newDirectoryStream(root)) {
            for (Path p : dir) {
                String name = p.getFileName().toString();
                if (name.endsWith(".tmp")) continue;
                int dot = name.indexOf('.');
                String keyPart = dot > 0 ? name.substring(0, dot) : name;
                if (used.contains(keyPart)) continue;
                try {
                    if (Files.getLastModifiedTime(p).toMillis() < cutoff) Files.deleteIfExists(p);
                } catch (IOException ignored) { }
            }
        } catch (IOException e) {
            log.warn("orphan sweep failed", e);
        }
    }
}
