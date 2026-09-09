package com.hidechat.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequestEntity, Long> {
    List<FriendRequestEntity> findByToUserAndStatusOrderByIdDesc(long toUser, int status);

    @Query("select r from FriendRequestEntity r where r.status = 0 and ((r.fromUser = :a and r.toUser = :b) or (r.fromUser = :b and r.toUser = :a))")
    Optional<FriendRequestEntity> findPendingBetween(@Param("a") long a, @Param("b") long b);
}
