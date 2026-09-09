package com.hidechat.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "friendships")
public class FriendshipEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_a", nullable = false)
    private Long userA;
    @Column(name = "user_b", nullable = false)
    private Long userB;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getUserA() { return userA; }
    public void setUserA(Long userA) { this.userA = userA; }
    public Long getUserB() { return userB; }
    public void setUserB(Long userB) { this.userB = userB; }
}
