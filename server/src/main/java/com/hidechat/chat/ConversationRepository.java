package com.hidechat.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {
    @Query("select c from ConversationEntity c where (c.userA = :a and c.userB = :b) or (c.userA = :b and c.userB = :a)")
    Optional<ConversationEntity> findPair(@Param("a") long a, @Param("b") long b);

    @Query("select c from ConversationEntity c where c.userA = :u or c.userB = :u order by c.lastMsgAt desc nulls last")
    List<ConversationEntity> findAllOf(@Param("u") long u);
}
