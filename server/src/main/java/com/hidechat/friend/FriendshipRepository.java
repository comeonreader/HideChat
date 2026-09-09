package com.hidechat.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<FriendshipEntity, Long> {
    /** 取两人(任意序)好友关系行 */
    @Query("select f from FriendshipEntity f where (f.userA = :a and f.userB = :b) or (f.userA = :b and f.userB = :a)")
    Optional<FriendshipEntity> findPair(@Param("a") long a, @Param("b") long b);

    @Query("select f from FriendshipEntity f where f.userA = :u or f.userB = :u")
    List<FriendshipEntity> findAllOf(@Param("u") long u);

    @Modifying
    @Query("delete from FriendshipEntity f where (f.userA = :a and f.userB = :b) or (f.userA = :b and f.userB = :a)")
    void deletePair(@Param("a") long a, @Param("b") long b);
}