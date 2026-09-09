package com.hidechat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/** 设计 4.4/D6：未读消息超过 UNREAD_MAX_DAYS 兜底物理删除（接收方一直未查看） */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://127.0.0.1:5434/hidechat_test",
        "spring.datasource.username=hidechat",
        "spring.datasource.password=hidechat",
        "app.unread-max-days=1",
        "app.msg-ttl-minutes=10",
        "app.sweep-interval-ms=300"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class UnreadCapTest {

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM messages");
        jdbc.update("DELETE FROM friend_requests");
        jdbc.update("DELETE FROM conversations");
        jdbc.update("DELETE FROM friendships");
        jdbc.update("DELETE FROM users");
    }

    @Test
    void unviewedOlderThanCapIsPurged() throws Exception {
        jdbc.update("INSERT INTO users (id, username, password_hash) VALUES (1,'cap_a','x'),(2,'cap_b','x')");
        jdbc.update("INSERT INTO conversations (id, user_a, user_b) VALUES (1,1,2)");
        // 两条未读：一条 2 天前（超 1 天兜底），一条刚发
        jdbc.update("INSERT INTO messages (conv_id, sender_id, kind, text_body, send_at) " +
                "VALUES (1, 1, 1, 'aged-unread', now() - interval '2 days')");
        jdbc.update("INSERT INTO messages (conv_id, sender_id, kind, text_body, send_at) " +
                "VALUES (1, 1, 1, 'fresh-unread', now())");

        // 等清扫器（300ms 周期）删掉超期行
        long deadline = System.currentTimeMillis() + 8000;
        long aged = 1;
        while (System.currentTimeMillis() < deadline && aged > 0) {
            Thread.sleep(500);
            Long c = jdbc.queryForObject("select count(*) from messages where text_body='aged-unread'", Long.class);
            aged = c;
        }
        assertThat(aged).isZero();
        Long fresh = jdbc.queryForObject("select count(*) from messages where text_body='fresh-unread'", Long.class);
        assertThat(fresh).isEqualTo(1);
        Long total = jdbc.queryForObject("select count(*) from messages", Long.class);
        assertThat(total).isEqualTo(1);
    }
}
