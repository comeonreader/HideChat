package com.hidechat.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "friend_requests")
public class FriendRequestEntity {
    public static final int PENDING = 0;
    public static final int ACCEPTED = 1;
    public static final int REJECTED = 2;
    public static final int WITHDRAWN = 3;

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "from_user", nullable = false)
    private Long fromUser;
    @Column(name = "to_user", nullable = false)
    private Long toUser;
    @Column(length = 200)
    private String message;
    @Column(nullable = false)
    private int status = PENDING;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "responded_at")
    private Instant respondedAt;

    public Long getId() { return id; }
    public Long getFromUser() { return fromUser; }
    public void setFromUser(Long v) { fromUser = v; }
    public Long getToUser() { return toUser; }
    public void setToUser(Long v) { toUser = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { message = v; }
    public int getStatus() { return status; }
    public void setStatus(int v) { status = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Instant v) { respondedAt = v; }
}
