package com.hidechat.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByConvId(long convId);

    Optional<MessageEntity> findFirstByConvIdOrderByIdDesc(long convId);

    long countByMediaKey(java.util.UUID mediaKey);

    Optional<MessageEntity> findFirstByMediaKey(java.util.UUID mediaKey);

    @Query("select m from MessageEntity m where m.mediaKey is not null")
    List<MessageEntity> findAllWithMedia();

    /** 回复激活：把该会话对端发来且尚未激活的消息置位 */
    @Modifying
    @Query("update MessageEntity m set m.activatedAt = :now where m.convId = :convId and m.senderId = :senderId and m.activatedAt is null")
    int activateIncoming(@Param("convId") long convId, @Param("senderId") long senderId, @Param("now") Instant now);

    /** 会话内可见消息分页（倒序，beforeId 游标）。可见性规则见设计 4.2/附录B3 */
    @Query(nativeQuery = true, value = """
            select m.* from messages m
            where m.conv_id = :convId
              and ((m.sender_id = :viewer and :now < m.send_at + make_interval(secs => :ttlSecs))
                   or (m.sender_id <> :viewer
                       and (m.activated_at is null or :now < m.activated_at + make_interval(secs => :ttlSecs))))
              and (:beforeId is null or m.id < :beforeId)
            order by m.id desc limit :limit""")
    List<MessageEntity> findVisiblePage(@Param("convId") long convId, @Param("viewer") long viewer,
                                        @Param("ttlSecs") long ttlSecs, @Param("now") Instant now,
                                        @Param("beforeId") Long beforeId, @Param("limit") int limit);

    /** 会话内对某用户可见的最后一条消息（会话摘要用） */
    @Query(nativeQuery = true, value = """
            select m.* from messages m
            where m.conv_id = :convId
              and ((m.sender_id = :viewer and :now < m.send_at + make_interval(secs => :ttlSecs))
                   or (m.sender_id <> :viewer
                       and (m.activated_at is null or :now < m.activated_at + make_interval(secs => :ttlSecs))))
            order by m.id desc limit 1""")
    List<MessageEntity> findLastVisible(@Param("convId") long convId, @Param("viewer") long viewer,
                                        @Param("ttlSecs") long ttlSecs, @Param("now") Instant now);

    @Query("select count(m) from MessageEntity m where m.convId = :convId and m.senderId <> :viewer and m.viewedAt is null")
    long countUnread(@Param("convId") long convId, @Param("viewer") long viewer);

    @Query("select m from MessageEntity m where m.convId = :convId and m.senderId = :sender and m.viewedAt is null")
    List<MessageEntity> findUnviewedOfSender(@Param("convId") long convId, @Param("sender") long sender);

    /** 发送方可视期到、尚未广播过（清扫器第 1 步） */
    @Query(nativeQuery = true, value = """
            select m.* from messages m
            where m.expire_notified_at is null
              and :now >= m.send_at + make_interval(secs => :ttlSecs)
            order by m.id limit 500""")
    List<MessageEntity> findSenderExpired(@Param("ttlSecs") long ttlSecs, @Param("now") Instant now);

    @Modifying
    @Query("update MessageEntity m set m.expireNotifiedAt = :now where m.id in :ids")
    int markExpireNotified(@Param("ids") List<Long> ids, @Param("now") Instant now);

    /** 可物理删除：已读超期 或 未读超过兜底天数 */
    @Query(nativeQuery = true, value = """
            select m.* from messages m
            where (m.activated_at is not null and :now >= m.activated_at + make_interval(secs => :ttlSecs))
               or (m.activated_at is null and :now >= m.send_at + make_interval(secs => :unreadCapSecs))
            order by m.id limit 500""")
    List<MessageEntity> findDeletable(@Param("ttlSecs") long ttlSecs, @Param("unreadCapSecs") long unreadCapSecs,
                                      @Param("now") Instant now);
}