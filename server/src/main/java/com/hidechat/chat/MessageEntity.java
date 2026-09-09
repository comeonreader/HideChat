package com.hidechat.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "messages")
public class MessageEntity {
    public static final int KIND_TEXT = 1;
    public static final int KIND_IMAGE = 2;
    public static final int KIND_VIDEO = 3;
    public static final int KIND_VOICE = 4;
    public static final int KIND_SYSTEM = 5; // 撤回提示等

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "conv_id", nullable = false)
    private Long convId;
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    @Column(nullable = false)
    private int kind = KIND_TEXT;
    @Column(name = "text_body", length = 2000)
    private String textBody;
    @Column(name = "media_key")
    private java.util.UUID mediaKey;
    @Column(name = "media_meta", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> mediaMeta;
    @Column(name = "send_at", nullable = false, updatable = false)
    private Instant sendAt = Instant.now();
    @Column(name = "viewed_at")
    private Instant viewedAt;
    @Column(name = "activated_at")
    private Instant activatedAt;
    @Column(name = "recalled_at")
    private Instant recalledAt;
    @Column(name = "recall_by")
    private Long recallBy;
    @Column(name = "expire_notified_at")
    private Instant expireNotifiedAt;

    public Long getId() { return id; }
    public Long getConvId() { return convId; }
    public void setConvId(Long v) { convId = v; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long v) { senderId = v; }
    public int getKind() { return kind; }
    public void setKind(int v) { kind = v; }
    public String getTextBody() { return textBody; }
    public void setTextBody(String v) { textBody = v; }
    public java.util.UUID getMediaKey() { return mediaKey; }
    public void setMediaKey(java.util.UUID v) { mediaKey = v; }
    public Map<String, Object> getMediaMeta() { return mediaMeta; }
    public void setMediaMeta(Map<String, Object> v) { mediaMeta = v; }
    public Instant getSendAt() { return sendAt; }
    public void setSendAt(Instant v) { sendAt = v; }
    public Instant getViewedAt() { return viewedAt; }
    public void setViewedAt(Instant v) { viewedAt = v; }
    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant v) { activatedAt = v; }
    public Instant getRecalledAt() { return recalledAt; }
    public void setRecalledAt(Instant v) { recalledAt = v; }
    public Long getRecallBy() { return recallBy; }
    public void setRecallBy(Long v) { recallBy = v; }
    public Instant getExpireNotifiedAt() { return expireNotifiedAt; }
    public void setExpireNotifiedAt(Instant v) { expireNotifiedAt = v; }
}