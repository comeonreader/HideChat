package com.hidechat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/** M3 验收：媒体上传/发送/签名下载/越权/到期与撤回物理删文件（真 PG + TTL=1 分钟） */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://127.0.0.1:5434/hidechat_test",
        "spring.datasource.username=hidechat",
        "spring.datasource.password=hidechat",
        "app.rate.register-limit=10000",
        "app.msg-ttl-minutes=1",
        "app.sweep-interval-ms=300",
        "app.upload-dir=/tmp/hidechat-it-uploads"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MediaFlowTest {

    // 1x1 红色 PNG
    private static final byte[] PNG = java.util.Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    @Autowired
    private JdbcTemplate jdbc;

    @LocalServerPort
    private int port;

    private final TestRestTemplate rest = httpClient();

    private static TestRestTemplate httpClient() {
        TestRestTemplate tr = new TestRestTemplate();
        tr.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return tr;
    }

    private String base() { return "http://127.0.0.1:" + port; }

    @BeforeEach
    void clean() throws Exception {
        jdbc.update("DELETE FROM messages");
        jdbc.update("DELETE FROM friend_requests");
        jdbc.update("DELETE FROM conversations");
        jdbc.update("DELETE FROM friendships");
        jdbc.update("DELETE FROM users");
        Path dir = Path.of("/tmp/hidechat-it-uploads");
        if (Files.exists(dir)) {
            try (Stream<Path> s = Files.list(dir)) {
                s.forEach(p -> { try { Files.deleteIfExists(p); } catch (Exception ignored) { } });
            }
        }
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return h;
    }

    private Map<String, Object> reg(String u) {
        return rest.postForObject(base() + "/api/auth/register",
                Map.of("username", u, "password", "secret123"), Map.class);
    }

    private ResponseEntity<Map> upload(String token, String kind, byte[] bytes, boolean goodType) {
        HttpHeaders h = bearer(token);
        h.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("kind", kind);
        form.add("file", new ByteArrayResource(bytes) {
            @Override public String getFilename() { return goodType ? "a.png" : "a.mp4"; }
        });
        return rest.exchange(base() + "/api/upload", HttpMethod.POST, new HttpEntity<>(form, h), Map.class);
    }

    private static class Ws implements WebSocketHandler {
        final BlockingQueue<String> inbox = new LinkedBlockingQueue<>();
        volatile boolean open;
        WebSocketSession session;
        @Override public void afterConnectionEstablished(WebSocketSession s) { open = true; session = s; }
        @Override public void handleMessage(WebSocketSession s, WebSocketMessage<?> m) { inbox.offer(m.getPayload().toString()); }
        @Override public void handleTransportError(WebSocketSession s, Throwable e) { }
        @Override public void afterConnectionClosed(WebSocketSession s, CloseStatus st) { open = false; }
        @Override public boolean supportsPartialMessages() { return false; }
        void send(String json) throws Exception { session.sendMessage(new TextMessage(json)); }
    }

    private Ws connect(String token) throws Exception {
        Ws w = new Ws();
        StandardWebSocketClient client = new StandardWebSocketClient();
        w.session = client.execute(w, "ws://127.0.0.1:" + port + "/ws").get(10, TimeUnit.SECONDS);
        w.send("{\"type\":\"auth\",\"token\":\"" + token + "\"}");
        return w;
    }

    private String waitFor(Ws w, String needle, long ms) throws Exception {
        long deadline = System.currentTimeMillis() + ms;
        while (System.currentTimeMillis() < deadline) {
            String f = w.inbox.poll(300, TimeUnit.MILLISECONDS);
            if (f != null && f.contains(needle)) return f;
        }
        return null;
    }

    private void awaitTrue(java.util.function.BooleanSupplier cond, long ms) throws Exception {
        long deadline = System.currentTimeMillis() + ms;
        while (!cond.getAsBoolean()) {
            if (System.currentTimeMillis() > deadline) throw new AssertionError("timeout waiting condition");
            Thread.sleep(120);
        }
    }

    @SuppressWarnings("unchecked")
    @Test
    void mediaLifecycle() throws Exception {
        // 建好友（b→a 申请，a 同意）并拿到会话
        Map<String, Object> ra = reg("media_a");
        Map<String, Object> rb = reg("media_b");
        Map<String, Object> rc = reg("media_c"); // 无关第三人
        String ta = (String) ra.get("token"), tb = (String) rb.get("token"), tc = (String) rc.get("token");
        long bId = ((Number) ((Map<String, Object>) rb.get("user")).get("id")).longValue();
        ResponseEntity<Map> reqResp = rest.exchange(base() + "/api/friend-requests", HttpMethod.POST,
                new HttpEntity<>(Map.of("to_user_id", bId, "message", "hi"), bearer(ta)), Map.class);
        System.out.println("DEBUG reqResp: " + reqResp.getStatusCode() + " " + reqResp.getBody());
        List<Map<String, Object>> inc = rest.exchange(base() + "/api/friend-requests", HttpMethod.GET,
                new HttpEntity<>(null, bearer(tb)), List.class).getBody();
        long reqId = ((Number) inc.get(0).get("id")).longValue();
        rest.exchange(base() + "/api/friend-requests/" + reqId + "/accept", HttpMethod.POST,
                new HttpEntity<>(Map.of(), bearer(tb)), Map.class);
        Map<String, Object> conv = rest.exchange(base() + "/api/conv-with/" + bId, HttpMethod.GET,
                new HttpEntity<>(null, bearer(ta)), Map.class).getBody();
        long convId = ((Number) conv.get("id")).longValue();

        // 上传类型校验
        ResponseEntity<Map> badUpload = upload(ta, "video", PNG, true);
        assertThat(badUpload.getStatusCode().value()).isEqualTo(400);

        // 上传图片
        ResponseEntity<Map> up = upload(ta, "image", PNG, true);
        assertThat(up.getStatusCode().is2xxSuccessful()).isTrue();
        String key = (String) up.getBody().get("key");
        assertThat(key).isNotBlank();
        long totalFiles = 0;
        try (Stream<Path> s = Files.list(Path.of("/tmp/hidechat-it-uploads"))) {
            totalFiles = s.count();
        }
        assertThat(totalFiles).isEqualTo(1);

        // WS 发图片消息
        Ws wa = connect(ta);
        Ws wb = connect(tb);
        assertThat(waitFor(wa, "auth_ok", 5000)).isNotNull();
        assertThat(waitFor(wb, "auth_ok", 5000)).isNotNull();
        wa.send("{\"type\":\"send\",\"client_msg_id\":\"img1\",\"conv_id\":" + convId
                + ",\"kind\":\"image\",\"media\":{\"key\":\"" + key
                + "\",\"meta\":{\"size\":68,\"ext\":\"png\",\"width\":1,\"height\":1}}}");
        String got = waitFor(wb, "media", 6000);
        assertThat(got).isNotNull();
        assertThat(got).contains(key);
        String pageA = rest.exchange(base() + "/api/conversations/" + convId + "/messages", HttpMethod.GET,
                new HttpEntity<>(null, bearer(tb)), List.class).getBody().toString();
        assertThat(pageA).contains(key);

        // 签名 URL：本人与对方可下；第三人 403；坏签名 401
        String meUrl = rest.exchange(base() + "/api/media-url/" + key, HttpMethod.GET,
                new HttpEntity<>(null, bearer(ta)), Map.class).getBody().get("url").toString();
        String peerUrl = rest.exchange(base() + "/api/media-url/" + key, HttpMethod.GET,
                new HttpEntity<>(null, bearer(tb)), Map.class).getBody().get("url").toString();
        ResponseEntity<byte[]> dl = rest.exchange(base() + meUrl, HttpMethod.GET,
                new HttpEntity<>(null), byte[].class);
        assertThat(dl.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(dl.getBody()).isEqualTo(PNG);
        ResponseEntity<Map> stranger = rest.exchange(base() + "/api/media-url/" + key, HttpMethod.GET,
                new HttpEntity<>(null, bearer(tc)), Map.class);
        assertThat(stranger.getStatusCode().value()).isEqualTo(403);
        String badSig = peerUrl.replaceFirst("sig=[a-f0-9]+", "sig=0000");
        ResponseEntity<String> badSigResp = rest.exchange(base() + badSig, HttpMethod.GET,
                new HttpEntity<>(null), String.class);
        assertThat(badSigResp.getStatusCode().value()).isEqualTo(401);

        // Range 请求（视频拖动）
        HttpHeaders rh = new HttpHeaders();
        rh.set("Range", "bytes=0-3");
        ResponseEntity<byte[]> ranged = rest.exchange(base() + meUrl, HttpMethod.GET,
                new HttpEntity<>(null, rh), byte[].class);
        assertThat(ranged.getStatusCode().value()).isEqualTo(206);
        assertThat(ranged.getBody()).hasSize(4);

        // b 查看（不激活）→ 等待；b 回复后激活 → 老化 activated_at → 行删 + 文件删
        wb.send("{\"type\":\"read_conv\",\"conv_id\":" + convId + "}");
        Thread.sleep(800);
        Long msgId = jdbc.queryForObject("select id from messages where media_key = ?::uuid", Long.class, key);
        Long preAct = jdbc.queryForObject("select count(*) from messages where id=? and activated_at is not null", Long.class, msgId);
        assertThat(preAct).isZero(); // 只查看不激活
        wb.send("{\"type\":\"send\",\"client_msg_id\":\"act1\",\"conv_id\":" + convId + ",\"kind\":\"text\",\"text\":\"回复激活图片销毁\"}");
        awaitTrue(() -> {
            Long v = jdbc.queryForObject("select count(*) from messages where media_key = ?::uuid and activated_at is not null",
                    Long.class, key);
            return v != null && v > 0;
        }, 6000);
        jdbc.update("update messages set activated_at = now() - interval '70 seconds' where media_key = ?::uuid", key);
        assertThat(waitFor(wb, "msg_expired", 6000)).isNotNull();
        awaitTrue(() -> {
            Long c = jdbc.queryForObject("select count(*) from messages where id = ?", Long.class, msgId);
            return c == 0;
        }, 6000);
        awaitTrue(() -> {
            try (Stream<Path> s = Files.list(Path.of("/tmp/hidechat-it-uploads"))) {
                return s.findAny().isEmpty();
            } catch (Exception e) { return false; }
        }, 6000);

        // 撤回未读消息 → 媒体文件同步物理删除
        ResponseEntity<Map> up2 = upload(ta, "image", PNG, true);
        String key2 = (String) up2.getBody().get("key");
        wa.send("{\"type\":\"send\",\"client_msg_id\":\"img2\",\"conv_id\":" + convId
                + ",\"kind\":\"image\",\"media\":{\"key\":\"" + key2 + "\",\"meta\":{\"size\":68,\"ext\":\"png\"}}}");
        Thread.sleep(400);
        Long msg2Id = jdbc.queryForObject("select id from messages where media_key = ?::uuid", Long.class, key2);
        wa.send("{\"type\":\"recall\",\"msg_id\":" + msg2Id + "}");
        awaitTrue(() -> {
            Long c = jdbc.queryForObject("select count(*) from messages where id = ?", Long.class, msg2Id);
            return c == 0;
        }, 5000);
        awaitTrue(() -> {
            try (Stream<Path> s = Files.list(Path.of("/tmp/hidechat-it-uploads"))) {
                return s.findAny().isEmpty();
            } catch (Exception e) { return false; }
        }, 5000);

        wa.session.close();
        wb.session.close();
    }
}