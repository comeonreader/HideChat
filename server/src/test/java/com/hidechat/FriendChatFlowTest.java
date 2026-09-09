package com.hidechat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

import static org.assertj.core.api.Assertions.assertThat;

/** M2 验收：好友流 + 实时文本收发 + 送达/已读 + 撤回 + 销毁清扫（真 PG + 真 WS，TTL=1 分钟加速） */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://127.0.0.1:5434/hidechat_test",
        "spring.datasource.username=hidechat",
        "spring.datasource.password=hidechat",
        "app.rate.register-limit=10000",
        "app.msg-ttl-minutes=1",
        "app.recall-window-minutes=2",
        "app.sweep-interval-ms=300"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class FriendChatFlowTest {

    @Autowired
    private JdbcTemplate jdbc;

    @LocalServerPort
    private int port;

    private final TestRestTemplate rest = httpClient();
    private final ObjectMapper om = new ObjectMapper();

    private static TestRestTemplate httpClient() {
        TestRestTemplate tr = new TestRestTemplate();
        tr.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return tr;
    }

    private String base() { return "http://127.0.0.1:" + port; }

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM messages");
        jdbc.update("DELETE FROM friend_requests");
        jdbc.update("DELETE FROM conversations");
        jdbc.update("DELETE FROM friendships");
        jdbc.update("DELETE FROM users");
    }

    // ---------- WS 测试客户端 ----------
    static class Ws implements WebSocketHandler {
        final BlockingQueue<String> inbox = new LinkedBlockingQueue<>();
        volatile boolean open = false;
        WebSocketSession session;

        @Override public void afterConnectionEstablished(WebSocketSession s) { open = true; session = s; }
        @Override public void handleMessage(WebSocketSession s, WebSocketMessage<?> m) { inbox.offer(m.getPayload().toString()); }
        @Override public void handleTransportError(WebSocketSession s, Throwable e) { }
        @Override public void afterConnectionClosed(WebSocketSession s, CloseStatus st) { open = false; }
        @Override public boolean supportsPartialMessages() { return false; }

        void send(String json) throws Exception { session.sendMessage(new TextMessage(json)); }

        /** 等待出现同时包含所有关键字的帧；超时返回已收集帧 */
        List<String> expectAll(List<String> needles, long timeoutMs) throws Exception {
            long deadline = System.currentTimeMillis() + timeoutMs;
            List<String> got = new ArrayList<>();
            while (System.currentTimeMillis() < deadline) {
                String frame = inbox.poll(200, TimeUnit.MILLISECONDS);
                if (frame == null) continue;
                got.add(frame);
                if (needles.stream().allMatch(n -> got.stream().anyMatch(f -> f.contains(n)))) {
                    return got;
                }
            }
            return got;
        }
    }

    private Ws connect(String token) throws Exception {
        Ws w = new Ws();
        StandardWebSocketClient client = new StandardWebSocketClient();
        w.session = client.execute(w, "ws://127.0.0.1:" + port + "/ws").get(10, TimeUnit.SECONDS);
        w.send("{\"type\":\"auth\",\"token\":\"" + token + "\"}");
        return w;
    }

    private Map<String, Object> register(String username) {
        return rest.postForObject(base() + "/api/auth/register",
                Map.of("username", username, "password", "secret123", "nickname", "昵称" + username),
                Map.class);
    }

    private ResponseEntity<Map> get(String url, String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return rest.exchange(base() + url, HttpMethod.GET, new HttpEntity<>(null, h), Map.class);
    }

    private ResponseEntity<Map> post(String url, String token, Object body) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return rest.exchange(base() + url, HttpMethod.POST, new HttpEntity<>(body, h), Map.class);
    }

    private void awaitTrue(BooleanSupplier cond, long ms) throws InterruptedException {
        long deadline = System.currentTimeMillis() + ms;
        while (!cond.getAsBoolean()) {
            if (System.currentTimeMillis() > deadline) {
                throw new AssertionError("condition not met within " + ms + "ms");
            }
            Thread.sleep(100);
        }
    }

    @SuppressWarnings("unchecked")
    @Test
    void friendFlowChatReadRecallAndExpiry() throws Exception {
        Map<String, Object> ra = register("alice_a");
        Map<String, Object> rb = register("bob_b");
        String ta = (String) ra.get("token");
        String tb = (String) rb.get("token");
        long aId = ((Number) ((Map<String, Object>) ra.get("user")).get("id")).longValue();
        long bId = ((Number) ((Map<String, Object>) rb.get("user")).get("id")).longValue();

        Ws wa = connect(ta);
        Ws wb = connect(tb);
        assertThat(wa.expectAll(List.of("auth_ok"), 5000)).isNotEmpty();
        assertThat(wb.expectAll(List.of("auth_ok"), 5000)).isNotEmpty();

        // 1) 搜索（返回数组）
        List<Map<String, Object>> arr = authGet("/api/users/search?q=bob&limit=5", ta, List.class);
        assertThat(arr).anyMatch(m -> ((Map<String, Object>) m.get("user")).get("username").equals("bob_b")
                && m.get("relation").equals("none"));

        // 2) b → a 申请；a 在线收到 friend_request
        ResponseEntity<Map> req = post("/api/friend-requests", tb, Map.of("to_user_id", aId, "message", "你好"));
        assertThat(req.getBody().get("state")).isEqualTo("pending");
        List<String> got = wa.expectAll(List.of("friend_request", "bob_b"), 5000);
        assertThat(got).isNotEmpty();

        // 3) a 同意；双方收到 friend_accepted
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> incoming = authGet("/api/friend-requests", ta, List.class);
        assertThat(incoming).hasSize(1);
        long reqId = ((Number) incoming.get(0).get("id")).longValue();
        ResponseEntity<Map> acc = post("/api/friend-requests/" + reqId + "/accept", ta, Map.of());
        assertThat(acc.getBody().get("state")).isEqualTo("accepted");
        assertThat(wa.expectAll(List.of("friend_accepted"), 5000)).isNotEmpty();
        List<String> gotB = wb.expectAll(List.of("friend_accepted"), 5000);
        assertThat(gotB).isNotEmpty();
        // 从 b 的事件里拿 conv_id
        String accFrame = gotB.stream().filter(f -> f.contains("friend_accepted")).findFirst().get();
        long convId = om.readTree(accFrame).get("conv_id").asLong();

        // 4) a 发文本 → b 实时收到 new_msg；a 收 ack_send + msg_delivered
        wa.send("{\"type\":\"send\",\"client_msg_id\":\"c1\",\"conv_id\":" + convId + ",\"kind\":\"text\",\"text\":\"你好呀 bob\"}");
        assertThat(wb.expectAll(List.of("new_msg", "你好呀 bob"), 5000)).isNotEmpty();
        List<String> aGot = wa.expectAll(List.of("ack_send", "msg_delivered"), 5000);
        assertThat(aGot.stream().anyMatch(f -> f.contains("ack_send"))).isTrue();
        assertThat(aGot.stream().anyMatch(f -> f.contains("msg_delivered"))).isTrue();

        // 5) b 打开会话置读 → a 收到 conv_read
        wb.send("{\"type\":\"read_conv\",\"conv_id\":" + convId + "}");
        assertThat(wa.expectAll(List.of("conv_read"), 5000)).isNotEmpty();

        // 6) b 拉取分页：1 条可见，viewed_at 已置
        List<Map<String, Object>> page = authGet("/api/conversations/" + convId + "/messages", tb, List.class);
        assertThat(page).hasSize(1);
        assertThat(page.get(0).get("text")).isEqualTo("你好呀 bob");
        assertThat(page.get(0).get("viewed_at")).isNotNull();

        // 7) 撤回（b 已读 → 转系统提示）
        long msgId = ((Number) page.get(0).get("id")).longValue();
        wa.send("{\"type\":\"recall\",\"msg_id\":" + msgId + "}");
        assertThat(wb.expectAll(List.of("recalled", "tip"), 5000)).isNotEmpty();
        List<Map<String, Object>> page2 = authGet("/api/conversations/" + convId + "/messages", tb, List.class);
        assertThat(page2).hasSize(1);
        assertThat(page2.get(0).get("kind")).isEqualTo(5);
        assertThat(page2.get(0).get("recalled")).isEqualTo(true);

        // 8) 撤回未读 = 无痕（b 发 msg2，a 未读时 b 撤回）
        wb.send("{\"type\":\"send\",\"client_msg_id\":\"c2\",\"conv_id\":" + convId + ",\"kind\":\"text\",\"text\":\"这条会无痕撤回\"}");
        Thread.sleep(300);
        List<Map<String, Object>> page3 = authGet("/api/conversations/" + convId + "/messages", tb, List.class);
        // a 的视角（未读）里也应只有提示消息 + msg2? a 未读 msg2，应 2 条
        HttpHeaders hb = new HttpHeaders();
        hb.setBearerAuth(ta);
        List<Map<String, Object>> pageA = rest.exchange(base() + "/api/conversations/" + convId + "/messages",
                HttpMethod.GET, new HttpEntity<>(null, hb), List.class).getBody();
        assertThat(pageA).hasSize(2);
        long msg2Id = ((Number) pageA.stream().filter(m -> "这条会无痕撤回".equals(m.get("text"))).findFirst().get().get("id")).longValue();
        wb.send("{\"type\":\"recall\",\"msg_id\":" + msg2Id + "}");
        Thread.sleep(400);
        List<Map<String, Object>> pageA2 = rest.exchange(base() + "/api/conversations/" + convId + "/messages",
                HttpMethod.GET, new HttpEntity<>(null, hb), List.class).getBody();
        assertThat(pageA2).hasSize(1); // 无痕消失，只剩撤回提示消息

        // 9) 发送方到期：a 发 msg3，b 不读；把 send_at 改到 TTL 前 → a 收 msg_expired，行保留（b 未读等待）
        wa.send("{\"type\":\"send\",\"client_msg_id\":\"c3\",\"conv_id\":" + convId + ",\"kind\":\"text\",\"text\":\"过期测试3\"}");
        Thread.sleep(300);
        long msg3Id = 0;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select id from messages where text_body='过期测试3'");
        msg3Id = ((Number) rows.get(0).get("id")).longValue();
        jdbc.update("update messages set send_at = now() - interval '70 seconds', expire_notified_at = null where id = ?", msg3Id);
        assertThat(wa.expectAll(List.of("msg_expired"), 5000)).isNotEmpty();
        Long cnt = jdbc.queryForObject("select count(*) from messages where id = ?", Long.class, msg3Id);
        assertThat(cnt).isEqualTo(1); // 物理行仍在（接收方未读等待中）

        // 10) 接收方到期（v1.2 回复激活）：a 发 msg4，b 查看不回复则等待；b 回复激活后把 activated_at 改到 TTL 前 → b 收 msg_expired，行物理删除
        wa.send("{\"type\":\"send\",\"client_msg_id\":\"c4\",\"conv_id\":" + convId + ",\"kind\":\"text\",\"text\":\"过期测试4\"}");
        Thread.sleep(300);
        rows = jdbc.queryForList("select id from messages where text_body='过期测试4'");
        long msg4Id = ((Number) rows.get(0).get("id")).longValue();
        // 阶段 A：b 只查看（read_conv）不回复 → 不激活不销毁（10s 观察期）
        wb.send("{\"type\":\"read_conv\",\"conv_id\":" + convId + "}");
        Thread.sleep(1500);
        Long active1 = jdbc.queryForObject("select count(*) from messages where id=? and activated_at is not null", Long.class, msg4Id);
        assertThat(active1).isZero();
        // 阶段 B：b 回复 → 激活
        wb.send("{\"type\":\"send\",\"client_msg_id\":\"r4\",\"conv_id\":" + convId + ",\"kind\":\"text\",\"text\":\"我回复了，开始计时\"}");
        awaitTrue(() -> {
            Long c = jdbc.queryForObject("select count(*) from messages where id=? and activated_at is not null", Long.class, msg4Id);
            return c != null && c > 0;
        }, 6000);
        jdbc.update("update messages set activated_at = now() - interval '70 seconds' where id = ?", msg4Id);
        // b（阅读方）在线会收到 msg_expired 且行被删
        boolean bGot = false;
        long deadline = System.currentTimeMillis() + 6000;
        while (System.currentTimeMillis() < deadline) {
            String frame = wb.inbox.poll(300, TimeUnit.MILLISECONDS);
            if (frame != null && frame.contains("msg_expired") && frame.contains("\"msg_id\":" + msg4Id)) {
                bGot = true;
                break;
            }
        }
        assertThat(bGot).isTrue();
        awaitTrue(() -> {
            Long c = jdbc.queryForObject("select count(*) from messages where id = ?", Long.class, msg4Id);
            return c == 0;
        }, 5000);

        // 11) 会话列表与未读数
        List<Map<String, Object>> cl = authGet("/api/conversations", ta, List.class);
        assertThat(cl).isNotEmpty();

        // 12) 删除好友 → 会话与消息清空
        ResponseEntity<Map> del = rest.exchange(base() + "/api/friends/" + bId,
                HttpMethod.DELETE, new HttpEntity<>(null, bearer(ta)), Map.class);
        assertThat(del.getStatusCode().is2xxSuccessful()).isTrue();
        awaitTrue(() -> {
            Long c = jdbc.queryForObject("select count(*) from messages", Long.class);
            return c == 0;
        }, 5000);
        assertThat(wa.expectAll(List.of("friend_deleted"), 5000)).isNotEmpty();
        wa.session.close();
        wb.session.close();
    }


    private <T> T authGet(String url, String token, Class<T> type) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return rest.exchange(base() + url, HttpMethod.GET, new HttpEntity<>(null, h), type).getBody();
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return h;
    }
}