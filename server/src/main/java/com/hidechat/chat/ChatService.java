package com.hidechat.chat;

import com.hidechat.config.AppConfig;
import com.hidechat.error.ApiException;
import com.hidechat.friend.FriendService;
import com.hidechat.user.User;
import com.hidechat.user.UserDto;
import com.hidechat.user.UserRepository;
import com.hidechat.ws.Notifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ChatService {
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final UserRepository users;
    private final FriendService friends;
    private final AppConfig cfg;
    private final Notifier notifier;
    private final com.hidechat.media.MediaService media;
    public ChatService(ConversationRepository conversations, MessageRepository messages, UserRepository users,
                       FriendService friends, AppConfig cfg, Notifier notifier,
                       com.hidechat.media.MediaService media) {
        this.conversations = conversations;
        this.messages = messages;
        this.users = users;
        this.friends = friends;
        this.cfg = cfg;
        this.notifier = notifier;
        this.media = media;
    }

    public long ttlSecs() {
        return cfg.msgTtlMinutes() * 60;
    }

    // ---------- 发送 ----------
    @Transactional
    public void send(long me, Map<String, Object> frame) {
        long convId = ((Number) frame.get("conv_id")).longValue();
        String kindStr = String.valueOf(frame.getOrDefault("kind", ""));
        int kind = switch (kindStr) {
            case "text" -> MessageEntity.KIND_TEXT;
            case "image" -> MessageEntity.KIND_IMAGE;
            case "video" -> MessageEntity.KIND_VIDEO;
            case "voice" -> MessageEntity.KIND_VOICE;
            default -> throw ApiException.badRequest("BAD_KIND", "不支持的消息类型: " + kindStr);
        };
        ConversationEntity conv = requireMember(convId, me);
        MessageEntity m = new MessageEntity();
        m.setConvId(conv.getId());
        m.setSenderId(me);
        m.setKind(kind);
        if (kind == MessageEntity.KIND_TEXT) {
            String text = frame.get("text") == null ? "" : frame.get("text").toString();
            if (text.isBlank()) {
                throw ApiException.badRequest("EMPTY_TEXT", "不能发送空消息");
            }
            if (text.length() > cfg.maxTextChars()) {
                throw ApiException.badRequest("TEXT_TOO_LONG", "文本超过 " + cfg.maxTextChars() + " 字");
            }
            m.setTextBody(text);
        } else {
            Object mk = null;
            @SuppressWarnings("unchecked")
            Map<String, Object> mediaMap = frame.get("media") instanceof Map
                    ? (Map<String, Object>) frame.get("media") : null;
            if (mediaMap != null) {
                mk = mediaMap.get("key");
                if (mediaMap.get("meta") instanceof Map meta2) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> metaTyped = (Map<String, Object>) meta2;
                    m.setMediaMeta(metaTyped);
                }
            }
            if (mk == null) mk = frame.get("media_key");
            if (mk == null) {
                throw ApiException.badRequest("NO_MEDIA", "媒体消息缺少 media.key");
            }
            java.util.UUID key;
            try {
                key = java.util.UUID.fromString(mk.toString());
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("BAD_MEDIA_KEY", "media.key 非法");
            }
            if (messages.countByMediaKey(key) > 0) {
                throw ApiException.conflict("MEDIA_IN_USE", "该文件已被引用");
            }
            m.setMediaKey(key);
        }
        messages.save(m);
        long peer = otherOf(conv, me);
        // v1.2（附录B3）：我发送 = 回复激活 —— 对端此前未激活的消息从此刻起 20 分钟销毁
        messages.activateIncoming(conv.getId(), peer, Instant.now());
        conv.setLastMsgAt(Instant.now());

        String clientMsgId = frame.get("client_msg_id") == null ? null : frame.get("client_msg_id").toString();
        Map<String, Object> ack = notifier.frame("ack_send");
        ack.put("client_msg_id", clientMsgId);
        ack.put("msg_id", m.getId());
        ack.put("send_at", m.getSendAt().toEpochMilli());
        notifier.toUser(me, ack);

        Map<String, Object> payload = notifier.frame("new_msg");
        payload.put("msg", msgPayload(m));
        boolean delivered = notifier.toUser(peer, payload);
        if (delivered) {
            Map<String, Object> d = notifier.frame("msg_delivered");
            d.put("conv_id", conv.getId());
            d.put("msg_id", m.getId());
            notifier.toUser(me, d);
        }
    }

    // ---------- 已读 ----------
    @Transactional
    public void read(long me, long convId) {
        ConversationEntity conv = requireMember(convId, me);
        long peer = otherOf(conv, me);
        List<MessageEntity> unviewed = messages.findUnviewedOfSender(conv.getId(), peer);
        if (!unviewed.isEmpty()) {
            Instant now = Instant.now();
            long maxId = 0;
            for (MessageEntity m : unviewed) {
                m.setViewedAt(now);
                maxId = Math.max(maxId, m.getId());
            }
            Map<String, Object> ev = notifier.frame("conv_read");
            ev.put("conv_id", conv.getId());
            ev.put("msg_id", maxId);
            ev.put("read_at", now.toEpochMilli());
            notifier.toUser(peer, ev);
        }
    }

    // ---------- 撤回（D7：2 分钟内；未读无痕删，已读转提示） ----------
    @Transactional
    public void recall(long me, long msgId) {
        MessageEntity m = messages.findById(msgId)
                .orElseThrow(() -> ApiException.notFound("MSG_NOT_FOUND", "消息不存在"));
        if (m.getSenderId() != me) {
            throw ApiException.forbidden("NOT_YOUR_MSG", "只能撤回自己发送的消息");
        }
        Instant now = Instant.now();
        long windowMs = cfg.recallWindowMinutes() * 60_000L;
        if (now.toEpochMilli() - m.getSendAt().toEpochMilli() > windowMs) {
            throw ApiException.badRequest("TOO_LATE", "超过 " + cfg.recallWindowMinutes() + " 分钟，无法撤回");
        }
        ConversationEntity conv = conversations.findById(m.getConvId()).orElseThrow();
        long peer = otherOf(conv, m.getSenderId());
        if (m.getViewedAt() == null) {
            // 对方未读：无痕彻底删除（含媒体文件）
            java.util.List<java.util.UUID> keys = new ArrayList<>();
            if (m.getMediaKey() != null) keys.add(m.getMediaKey());
            messages.delete(m);
            media.deleteKeys(keys);
            Map<String, Object> ev = notifier.frame("recalled");
            ev.put("msg_id", msgId);
            ev.put("recall_kind", "silent");
            notifier.toUser(me, ev);
        } else {
            java.util.List<java.util.UUID> keys = new ArrayList<>();
            if (m.getMediaKey() != null) keys.add(m.getMediaKey());
            m.setKind(MessageEntity.KIND_SYSTEM);
            m.setRecalledAt(now);
            m.setRecallBy(me);
            m.setTextBody(null);
            m.setMediaKey(null);
            m.setMediaMeta(null);
            media.deleteKeys(keys);
            Map<String, Object> ev = notifier.frame("recalled");
            ev.put("msg_id", msgId);
            ev.put("recall_kind", "tip");
            notifier.toUser(me, ev);
            notifier.toUser(peer, ev);
        }
    }

    // ---------- 会话列表 / 分页 / init ----------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> conversationList(long me) {
        Instant now = Instant.now();
        List<Map<String, Object>> out = new ArrayList<>();
        for (ConversationEntity c : conversations.findAllOf(me)) {
            long peer = otherOf(c, me);
            Optional<User> pu = users.findById(peer);
            if (pu.isEmpty()) {
                continue;
            }
            List<MessageEntity> last = messages.findLastVisible(c.getId(), me, ttlSecs(), now);
            long unread = messages.countUnread(c.getId(), me);
            if (last.isEmpty() && unread == 0 && c.getLastMsgAt() == null) {
                continue; // 尚无消息的会话不进列表（从通讯录发起）
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("friend", UserDto.of(pu.get()));
            item.put("last_msg", last.isEmpty() ? null : msgPayload(last.get(0)));
            item.put("unread", unread);
            item.put("last_msg_at", c.getLastMsgAt() == null ? null : c.getLastMsgAt().toEpochMilli());
            out.add(item);
        }
        out.sort(Comparator.comparingLong((Map<String, Object> x) ->
                ((Number) x.get("last_msg_at")).longValue()).reversed());
        return out;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> messagePage(long me, long convId, Long beforeId, int limit) {
        requireMember(convId, me);
        List<MessageEntity> rows = messages.findVisiblePage(convId, me, ttlSecs(), Instant.now(), beforeId, limit);
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = rows.size() - 1; i >= 0; i--) {
            out.add(msgPayload(rows.get(i)));
        }
        return out;
    }

    public Map<String, Object> msgPayload(MessageEntity m) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", m.getId());
        out.put("conv_id", m.getConvId());
        out.put("sender_id", m.getSenderId());
        out.put("kind", m.getKind());
        if (m.getTextBody() != null) {
            out.put("text", m.getTextBody());
        }
        if (m.getMediaKey() != null) {
            Map<String, Object> media = new LinkedHashMap<>();
            media.put("key", m.getMediaKey().toString());
            media.put("meta", m.getMediaMeta());
            out.put("media", media);
        }
        if (m.getKind() == MessageEntity.KIND_SYSTEM && m.getRecalledAt() != null) {
            out.put("recalled", true);
        }
        out.put("send_at", m.getSendAt().toEpochMilli());
        out.put("viewed_at", m.getViewedAt() == null ? null : m.getViewedAt().toEpochMilli());
        out.put("activated_at", m.getActivatedAt() == null ? null : m.getActivatedAt().toEpochMilli());
        return out;
    }

    @Transactional
    public Map<String, Object> convWith(long me, long friendId) {
        if (!friends.areFriends(me, friendId)) {
            throw com.hidechat.error.ApiException.forbidden("NOT_FRIEND", "你们不是好友");
        }
        long a = Math.min(me, friendId);
        long b = Math.max(me, friendId);
        ConversationEntity conv = conversations.findPair(a, b).orElseGet(() ->
                conversations.save(new ConversationEntity(a, b)));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", conv.getId());
        return out;
    }

    public ConversationEntity requireMember(long convId, long me) {
        ConversationEntity c = conversations.findById(convId)
                .orElseThrow(() -> ApiException.notFound("CONV_NOT_FOUND", "会话不存在"));
        if (c.getUserA() != me && c.getUserB() != me) {
            throw ApiException.forbidden("NOT_MEMBER", "你不是该会话成员");
        }
        return c;
    }

    public static long otherOf(ConversationEntity c, long me) {
        return c.getUserA() == me ? c.getUserB() : c.getUserA();
    }
}