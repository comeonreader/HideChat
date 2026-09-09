package com.hidechat.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "conversations")
public class ConversationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_a", nullable = false)
    private Long userA;
    @Column(name = "user_b", nullable = false)
    private Long userB;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "last_msg_at")
    private Instant lastMsgAt;

    public ConversationEntity() {}
    public ConversationEntity(Long a, Long b) { this.userA = a; this.userB = b; }

    public Long getId() { return id; }
    public Long getUserA() { return userA; }
    public Long getUserB() { return userB; }
    public Instant getLastMsgAt() { return lastMsgAt; }
    public void setLastMsgAt(Instant v) { lastMsgAt = v; }
}
