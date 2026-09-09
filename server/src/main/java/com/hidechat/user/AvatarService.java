package com.hidechat.user;

import com.hidechat.config.AppConfig;
import com.hidechat.error.ApiException;
import com.hidechat.friend.FriendService;
import com.hidechat.ws.Notifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;

/** 头像：独立 avatars volume，永久保存；版本号驱动缓存刷新（设计 8.5） */
@Service
public class AvatarService {
    private static final Logger log = LoggerFactory.getLogger(AvatarService.class);

    private final UserRepository users;
    private final FriendService friends;
    private final AppConfig cfg;
    private final Notifier notifier;
    private final Path root;

    public AvatarService(UserRepository users, FriendService friends, AppConfig cfg, Notifier notifier) {
        this.users = users;
        this.friends = friends;
        this.cfg = cfg;
        this.notifier = notifier;
        this.root = Path.of(cfg.avatarDir());
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("无法创建头像目录 " + root, e);
        }
    }

    /** 识别并返回扩展名（jpg/png/webp），否则 null */
    private String sniff(byte[] head) {
        if (head.length >= 4 && (head[0] & 0xFF) == 0x89 && head[1] == 0x50 && head[2] == 0x4E && head[3] == 0x47) {
            return "png";
        }
        if (head.length >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (head.length >= 12 && head[0] == 0x52 && head[1] == 0x49 && head[2] == 0x46 && head[3] == 0x46
                && head[8] == 0x57 && head[9] == 0x45 && head[10] == 0x42 && head[11] == 0x50) {
            return "webp";
        }
        return null;
    }

    @Transactional
    public Map<String, Object> upload(User me, MultipartFile file) {
        long maxBytes = cfg.maxAvatarMb() * 1024 * 1024;
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("EMPTY_FILE", "请选择图片文件");
        }
        if (file.getSize() > maxBytes) {
            throw ApiException.badRequest("FILE_TOO_LARGE", "头像不能超过 " + cfg.maxAvatarMb() + "MB");
        }
        byte[] head = new byte[12];
        try (InputStream in = file.getInputStream()) {
            int n = in.read(head);
            byte[] sniff = java.util.Arrays.copyOf(head, Math.max(n, 0));
            String ext = sniff(sniff);
            if (ext == null) {
                throw ApiException.badRequest("BAD_IMAGE", "仅支持 jpg/png/webp 图片");
            }
        } catch (IOException e) {
            throw ApiException.badRequest("READ_FAILED", "读取文件失败");
        }
        String ext = null;
        try {
            byte[] sniff = file.getInputStream().readNBytes(12);
            ext = sniff(sniff);
            if (ext == null) {
                throw ApiException.badRequest("BAD_IMAGE", "仅支持 jpg/png/webp 图片");
            }
            Path target = root.resolve(me.getId() + "." + ext);
            Path tmp = Files.createTempFile(root, me.getId() + "-", ".tmp");
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
            }
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("avatar save failed", e);
            throw ApiException.badRequest("SAVE_FAILED", "头像保存失败");
        }
        String oldExt = me.getAvatarExt();
        if (oldExt != null && !oldExt.equals(ext)) {
            try { Files.deleteIfExists(root.resolve(me.getId() + "." + oldExt)); } catch (IOException ignored) { }
        }
        me.setAvatarExt(ext);
        me.setAvatarVersion(me.getAvatarVersion() + 1);
        users.save(me); // 拦截器加载的实体已脱管，必须合并持久化
        broadcastProfile(me);
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("avatar_ext", ext);
        out.put("avatar_version", me.getAvatarVersion());
        return out;
    }

    @Transactional
    public void remove(User me) {
        if (me.getAvatarExt() != null) {
            try { Files.deleteIfExists(root.resolve(me.getId() + "." + me.getAvatarExt())); } catch (IOException ignored) { }
            me.setAvatarExt(null);
            me.setAvatarVersion(me.getAvatarVersion() + 1);
            users.save(me);
            broadcastProfile(me);
        }
    }

    @Transactional
    public Map<String, Object> updateNickname(User me, String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw ApiException.badRequest("BAD_NICKNAME", "昵称不能为空");
        }
        String n = nickname.trim();
        if (n.length() > 30) {
            throw ApiException.badRequest("BAD_NICKNAME", "昵称最长 30 字");
        }
        me.setNickname(n);
        users.save(me);
        broadcastProfile(me);
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("nickname", n);
        return out;
    }

    /** 通知全部好友在线端资料变更（profile_updated） */
    private void broadcastProfile(User me) {
        Map<String, Object> ev = notifier.frame("profile_updated");
        ev.put("user_id", me.getId());
        ev.put("nickname", me.getNickname());
        ev.put("avatar_ext", me.getAvatarExt());
        ev.put("avatar_version", me.getAvatarVersion());
        for (UserDto f : friends.friendsOf(me.getId())) {
            notifier.toUser(f.id(), ev);
        }
    }

    public Path fileOf(long userId, String ext) {
        return root.resolve(userId + "." + ext);
    }
}