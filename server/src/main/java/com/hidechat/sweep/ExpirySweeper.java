package com.hidechat.sweep;

import com.hidechat.chat.ChatService;
import com.hidechat.chat.ConversationEntity;
import com.hidechat.chat.ConversationRepository;
import com.hidechat.chat.MessageEntity;
import com.hidechat.chat.MessageRepository;
import com.hidechat.config.AppConfig;
import com.hidechat.media.MediaService;
import com.hidechat.ws.Notifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** 每 30s：1) 发送方可视期到 → msg_expired 事件；2) 物理删除（已读+TTL / 未读 30 天兜底） */
@Component
public class ExpirySweeper {
    private static final Logger log = LoggerFactory.getLogger(ExpirySweeper.class);

    private final MessageRepository messages;
    private final ConversationRepository conversations;
    private final AppConfig cfg;
    private final Notifier notifier;
    private final MediaService media;

    public ExpirySweeper(MessageRepository messages, ConversationRepository conversations,
                         AppConfig cfg, Notifier notifier, MediaService media) {
        this.messages = messages;
        this.conversations = conversations;
        this.cfg = cfg;
        this.notifier = notifier;
        this.media = media;
    }

    @Scheduled(fixedDelayString = "${app.sweep-interval-ms:30000}")
    @Transactional
    public void sweep() {
        Instant now = Instant.now();
        long ttlSecs = cfg.msgTtlMinutes() * 60;
        try {
            // 1) 发送方侧到期：事件通知（DB 行可能仍为未读接收方保留）
            List<MessageEntity> senderExpired = messages.findSenderExpired(ttlSecs, now);
            if (!senderExpired.isEmpty()) {
                List<Long> ids = new ArrayList<>();
                for (MessageEntity m : senderExpired) {
                    ids.add(m.getId());
                    Map<String, Object> ev = notifier.frame("msg_expired");
                    ev.put("msg_id", m.getId());
                    notifier.toUser(m.getSenderId(), ev);
                }
                messages.markExpireNotified(ids, now);
            }
            // 2) 物理删除（含接收方侧到期；删除前向接收方发 msg_expired）
            long capSecs = cfg.unreadMaxDays() * 86400L;
            List<MessageEntity> deletable = messages.findDeletable(ttlSecs, capSecs, now);
            if (!deletable.isEmpty()) {
                List<Long> ids = new ArrayList<>();
                List<java.util.UUID> mediaKeys = new ArrayList<>();
                for (MessageEntity m : deletable) {
                    ids.add(m.getId());
                    if (m.getMediaKey() != null) {
                        mediaKeys.add(m.getMediaKey());
                    }
                    if (m.getActivatedAt() != null) {
                        ConversationEntity c = conversations.findById(m.getConvId()).orElse(null);
                        if (c != null) {
                            long receiver = ChatService.otherOf(c, m.getSenderId());
                            Map<String, Object> ev = notifier.frame("msg_expired");
                            ev.put("msg_id", m.getId());
                            notifier.toUser(receiver, ev);
                        }
                    }
                }
                messages.deleteAllByIdInBatch(ids);
                media.deleteKeys(mediaKeys);
                log.info("sweeper deleted {} messages and {} media files", ids.size(), mediaKeys.size());
            }
        } catch (Exception e) {
            log.error("sweeper error", e);
        }
    }
}