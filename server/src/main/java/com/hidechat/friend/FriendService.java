package com.hidechat.friend;

import com.hidechat.chat.ConversationEntity;
import com.hidechat.chat.ConversationRepository;
import com.hidechat.chat.MessageEntity;
import com.hidechat.chat.MessageRepository;
import com.hidechat.error.ApiException;
import com.hidechat.media.MediaService;
import com.hidechat.user.User;
import com.hidechat.user.UserDto;
import com.hidechat.user.UserRepository;
import com.hidechat.ws.Notifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FriendService {
    private final UserRepository users;
    private final FriendshipRepository friendships;
    private final FriendRequestRepository requests;
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final Notifier notifier;
    private final MediaService media;

    public FriendService(UserRepository users, FriendshipRepository friendships, FriendRequestRepository requests,
                         ConversationRepository conversations, MessageRepository messages, Notifier notifier,
                         MediaService media) {
        this.users = users;
        this.friendships = friendships;
        this.requests = requests;
        this.conversations = conversations;
        this.messages = messages;
        this.notifier = notifier;
        this.media = media;
    }

    // ---------- 好友列表 ----------
    @Transactional(readOnly = true)
    public List<UserDto> friendsOf(long userId) {
        return friendships.findAllOf(userId).stream()
                .map(f -> f.getUserA() == userId ? f.getUserB() : f.getUserA())
                .map(users::findById).filter(Optional::isPresent).map(Optional::get)
                .map(UserDto::of)
                .collect(Collectors.toList());
    }

    public boolean areFriends(long a, long b) {
        return friendships.findPair(a, b).isPresent();
    }

    // ---------- 搜索（用户名前缀/昵称包含；用户名不含 % _，昵称通配符先剔除） ----------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(long me, String q, int limit) {
        String query = q == null ? "" : q.trim();
        if (query.isEmpty()) {
            return List.of();
        }
        List<User> found = new ArrayList<>();
        users.findByUsername(query.toLowerCase()).ifPresent(found::add);
        if (found.size() < limit) {
            String clean = query.replace("%", "").replace("_", "");
            found.addAll(users.searchByUsernameOrNickname(
                    clean.toLowerCase() + "%", "%" + clean + "%", limit - found.size()));
        }
        Set<Long> friendIds = friendsOf(me).stream().map(UserDto::id).collect(Collectors.toSet());
        Set<Long> seen = new HashSet<>();
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : found) {
            if (u.getId() == me || !seen.add(u.getId())) {
                continue;
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("user", UserDto.of(u));
            m.put("relation", friendIds.contains(u.getId()) ? "friend" : "none");
            out.add(m);
        }
        return out;
    }

    // ---------- 申请流 ----------
    @Transactional
    public Map<String, Object> sendRequest(long fromId, long toId, String message) {
        if (fromId == toId) {
            throw ApiException.badRequest("SELF", "不能添加自己为好友");
        }
        User to = users.findById(toId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "用户不存在"));
        if (areFriends(fromId, toId)) {
            throw ApiException.conflict("ALREADY_FRIEND", "你们已经是好友");
        }
        Optional<FriendRequestEntity> pending = requests.findPendingBetween(fromId, toId);
        if (pending.isPresent()) {
            FriendRequestEntity ex = pending.get();
            if (ex.getFromUser() == fromId) {
                throw ApiException.conflict("ALREADY_REQUESTED", "已发送过申请，等待对方处理");
            }
            // 对方先申请过我 → 直接成为好友（设计：双向确认）
            return acceptInternal(ex.getId(), fromId);
        }
        FriendRequestEntity r = new FriendRequestEntity();
        r.setFromUser(fromId);
        r.setToUser(toId);
        r.setMessage(message == null ? "" : message.trim());
        requests.save(r);
        User from = users.findById(fromId).orElseThrow();
        Map<String, Object> ev = notifier.frame("friend_request");
        ev.put("request", Map.of(
                "id", r.getId(),
                "from", UserDto.of(from),
                "message", r.getMessage(),
                "created_at", r.getCreatedAt().toString()));
        notifier.toUser(toId, ev);
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("id", r.getId());
        ok.put("state", "pending");
        return ok;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> incomingRequests(long me) {
        return requests.findByToUserAndStatusOrderByIdDesc(me, FriendRequestEntity.PENDING).stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", r.getId());
                    m.put("from", UserDto.of(users.findById(r.getFromUser()).orElseThrow()));
                    m.put("message", r.getMessage());
                    m.put("created_at", r.getCreatedAt().toString());
                    return m;
                }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> accept(long requestId, long me) {
        return acceptInternal(requestId, me);
    }

    private Map<String, Object> acceptInternal(long requestId, long me) {
        FriendRequestEntity r = requests.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("REQUEST_NOT_FOUND", "申请不存在"));
        if (r.getStatus() != FriendRequestEntity.PENDING) {
            throw ApiException.conflict("REQUEST_RESOLVED", "该申请已处理");
        }
        if (r.getToUser() != me) {
            throw ApiException.forbidden("NOT_YOUR_REQUEST", "无权处理该申请");
        }
        r.setStatus(FriendRequestEntity.ACCEPTED);
        r.setRespondedAt(Instant.now());
        long a = Math.min(r.getFromUser(), r.getToUser());
        long b = Math.max(r.getFromUser(), r.getToUser());
        if (friendships.findPair(a, b).isEmpty()) {
            FriendshipEntity f = new FriendshipEntity();
            f.setUserA(a);
            f.setUserB(b);
            friendships.save(f);
        }
        // 会话即时建立（设计：好友成对即有会话）
        ConversationEntity conv = conversations.findPair(a, b).orElseGet(() ->
                conversations.save(new ConversationEntity(a, b)));
        Map<String, Object> ev = notifier.frame("friend_accepted");
        ev.put("friend", UserDto.of(users.findById(r.getFromUser()).orElseThrow()));
        ev.put("conv_id", conv.getId());
        notifier.toUser(me, ev);
        Map<String, Object> ev2 = notifier.frame("friend_accepted");
        ev2.put("friend", UserDto.of(users.findById(r.getToUser()).orElseThrow()));
        ev2.put("conv_id", conv.getId());
        notifier.toUser(r.getFromUser(), ev2);
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("state", "accepted");
        return ok;
    }

    @Transactional
    public Map<String, Object> reject(long requestId, long me) {
        FriendRequestEntity r = requests.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("REQUEST_NOT_FOUND", "申请不存在"));
        if (r.getStatus() != FriendRequestEntity.PENDING || r.getToUser() != me) {
            throw ApiException.conflict("REQUEST_RESOLVED", "该申请已处理");
        }
        r.setStatus(FriendRequestEntity.REJECTED);
        r.setRespondedAt(Instant.now());
        Map<String, Object> ev = notifier.frame("friend_request_result");
        ev.put("accepted", false);
        notifier.toUser(r.getFromUser(), ev);
        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("state", "rejected");
        return ok;
    }

    @Transactional
    public void withdraw(long requestId, long me) {
        FriendRequestEntity r = requests.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("REQUEST_NOT_FOUND", "申请不存在"));
        if (r.getFromUser() != me) {
            throw ApiException.forbidden("NOT_YOUR_REQUEST", "无权撤销");
        }
        r.setStatus(FriendRequestEntity.WITHDRAWN);
        r.setRespondedAt(Instant.now());
    }

    // ---------- 删除好友（级联清会话与消息，D8） ----------
    @Transactional
    public void deleteFriend(long me, long friendId) {
        if (!areFriends(me, friendId)) {
            throw ApiException.badRequest("NOT_FRIEND", "你们不是好友");
        }
        // 收集媒体键（M3 起物理删文件）
        List<java.util.UUID> mediaKeys = new ArrayList<>();
        long a = Math.min(me, friendId);
        long b = Math.max(me, friendId);
        conversations.findPair(a, b).ifPresent(c -> {
            List<MessageEntity> rows = messages.findByConvId(c.getId());
            for (MessageEntity m : rows) {
                if (m.getMediaKey() != null) {
                    mediaKeys.add(m.getMediaKey());
                }
            }
            messages.deleteAll(rows);
            conversations.delete(c);
        });
        friendships.deletePair(a, b);
        media.deleteKeys(mediaKeys);
        notifier.toUser(me, Map.of("type", "friend_deleted", "friend_id", friendId));
        notifier.toUser(friendId, Map.of("type", "friend_deleted", "friend_id", me));
    }
}