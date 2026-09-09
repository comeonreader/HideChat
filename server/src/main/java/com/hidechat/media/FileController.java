package com.hidechat.media;

import com.hidechat.chat.ChatService;
import com.hidechat.chat.ConversationEntity;
import com.hidechat.chat.ConversationRepository;
import com.hidechat.chat.MessageEntity;
import com.hidechat.chat.MessageRepository;
import com.hidechat.security.AuthInterceptor;
import com.hidechat.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

/** 消息媒体下载：/files/{key}?uid&exp&sig —— 校验签名/会话成员，支持视频 Range */
@RestController
public class FileController {
    private final MessageRepository messages;
    private final ConversationRepository conversations;
    private final MediaService media;
    private final MediaSigner signer;

    public FileController(MessageRepository messages, ConversationRepository conversations,
                          MediaService media, MediaSigner signer) {
        this.messages = messages;
        this.conversations = conversations;
        this.media = media;
        this.signer = signer;
    }

    @GetMapping("/api/media-url/{key}")
    public Map<String, String> signedUrl(HttpServletRequest http, @PathVariable String key) {
        User me = (User) http.getAttribute(AuthInterceptor.ATTR_USER);
        MessageEntity m = messageOfKey(key, me.getId());
        long exp = System.currentTimeMillis() + 6 * 3600 * 1000L;
        return Map.of("url", "/files/" + key + "?uid=" + me.getId() + "&exp=" + exp
                + "&sig=" + signer.sign(key, me.getId(), exp));
    }

    @GetMapping("/files/{key}")
    public void download(@PathVariable String key,
                         @RequestParam long uid,
                         @RequestParam long exp,
                         @RequestParam String sig,
                         HttpServletRequest request,
                         HttpServletResponse response) throws IOException {
        if (System.currentTimeMillis() > exp || !signer.verify(key, uid, exp, sig)) {
            response.sendError(401, "签名无效或已过期");
            return;
        }
        MessageEntity m = messageOfKey(key, uid);
        Path file = media.fileOf(key, extOf(m));
        if (!Files.exists(file)) {
            response.sendError(404, "文件不存在");
            return;
        }
        String ext = extOf(m);
        String contentType = switch (ext) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "gif" -> "image/gif";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "ogg" -> "audio/ogg";
            default -> "application/octet-stream";
        };
        response.setContentType(contentType);
        response.setHeader("Cache-Control", "private, max-age=21600");
        long total = Files.size(file);
        String range = request.getHeader("Range");
        if (range != null && range.startsWith("bytes=")) {
            String spec = range.substring(6);
            long start = 0;
            long end = total - 1;
            try {
                if (spec.endsWith("-")) {
                    start = Long.parseLong(spec.substring(0, spec.length() - 1));
                } else {
                    String[] parts = spec.split("-", 2);
                    start = Long.parseLong(parts[0]);
                    end = Math.min(Long.parseLong(parts[1]), total - 1);
                }
            } catch (NumberFormatException e) {
                start = 0;
            }
            if (start > end || start >= total) {
                response.setStatus(416);
                response.setHeader("Content-Range", "bytes */" + total);
                return;
            }
            response.setStatus(206);
            response.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + total);
            response.setContentLengthLong(end - start + 1);
            stream(file, response, start, end - start + 1);
        } else {
            response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
            response.setContentLengthLong(total);
            try (InputStream in = Files.newInputStream(file); OutputStream out = response.getOutputStream()) {
                in.transferTo(out);
            }
        }
    }

    private void stream(Path file, HttpServletResponse response, long start, long len) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            in.skipNBytes(start);
            byte[] buf = new byte[64 * 1024];
            long remaining = len;
            OutputStream out = response.getOutputStream();
            while (remaining > 0) {
                int n = in.read(buf, 0, (int) Math.min(buf.length, remaining));
                if (n < 0) break;
                out.write(buf, 0, n);
                remaining -= n;
            }
            out.flush();
        }
    }

    private MessageEntity messageOfKey(String key, long uid) {
        UUID uuid;
        try {
            uuid = UUID.fromString(key);
        } catch (IllegalArgumentException e) {
            throw new com.hidechat.error.ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "NOT_FOUND", "资源不存在");
        }
        MessageEntity m = messages.findFirstByMediaKey(uuid)
                .orElseThrow(() -> new com.hidechat.error.ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "NOT_FOUND", "资源不存在"));
        ConversationEntity conv = conversations.findById(m.getConvId()).orElseThrow();
        if (conv.getUserA() != uid && conv.getUserB() != uid) {
            throw new com.hidechat.error.ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "FORBIDDEN", "无权访问");
        }
        return m;
    }

    @SuppressWarnings("unchecked")
    private String extOf(MessageEntity m) {
        try {
            Map<String, Object> meta = m.getMediaMeta();
            if (meta != null && meta.get("ext") != null) return meta.get("ext").toString();
        } catch (Exception ignored) { }
        return "bin";
    }
}
