package com.hidechat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** M1 验收：WS 认证首帧 / 心跳 / 帧协议（设计 6.1-6.2） */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://127.0.0.1:5434/hidechat_test",
        "spring.datasource.username=hidechat",
        "spring.datasource.password=hidechat",
        "app.rate.register-limit=10000"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class WsFlowTest {

    private final TestRestTemplate rest = httpClient();

    private static TestRestTemplate httpClient() {
        TestRestTemplate tr = new TestRestTemplate();
        tr.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return tr;
    }

    @Autowired
    private JdbcTemplate jdbc;

    @LocalServerPort
    private int port;

    private String base() { return "http://127.0.0.1:" + port; }

    private final ObjectMapper om = new ObjectMapper();

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM messages");
        jdbc.update("DELETE FROM friend_requests");
        jdbc.update("DELETE FROM conversations");
        jdbc.update("DELETE FROM friendships");
        jdbc.update("DELETE FROM users");
    }

    private String register(String username) {
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = rest.postForObject(base() + "/api/auth/register",
                Map.of("username", username, "password", "secret123"), Map.class);
        return (String) resp.get("token");
    }

    /** 简单测试 WS 客户端：把收到的 JSON 放进队列 */
    private static class Client implements WebSocketHandler {
        final BlockingQueue<String> inbox = new LinkedBlockingQueue<>();
        volatile boolean open = false;

        @Override
        public void afterConnectionEstablished(WebSocketSession session) {
            open = true;
        }

        @Override
        public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
            inbox.offer(message.getPayload().toString());
        }

        @Override
        public void handleTransportError(WebSocketSession session, Throwable exception) { }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
            open = false;
        }

        @Override
        public boolean supportsPartialMessages() { return false; }

        String next(long ms) throws InterruptedException {
            return inbox.poll(ms, TimeUnit.MILLISECONDS);
        }
    }

    @Test
    void authPingAndFrameErrors() throws Exception {
        String token = register("wsuser1");
        StandardWebSocketClient client = new StandardWebSocketClient();
        Client c = new Client();
        WebSocketSession session = client.execute(c, "ws://127.0.0.1:" + port + "/ws").get(10, TimeUnit.SECONDS);
        assertThat(c.open).isTrue();

        // 未认证先发业务帧 → error
        session.sendMessage(new TextMessage("{\"type\":\"send\"}"));
        String e1 = c.next(5000);
        assertThat(e1).contains("UNAUTHENTICATED");

        // 错误 token → error + 服务端关闭
        Client c2 = new Client();
        WebSocketSession s2 = client.execute(c2, "ws://127.0.0.1:" + port + "/ws").get(10, TimeUnit.SECONDS);
        s2.sendMessage(new TextMessage("{\"type\":\"auth\",\"token\":\"bad.token.here\"}"));
        assertThat(c2.next(5000)).contains("BAD_TOKEN");
        // 服务端异步关闭，轮询等待
        long deadline = System.currentTimeMillis() + 5000;
        while (c2.open && System.currentTimeMillis() < deadline) {
            Thread.sleep(50);
        }
        assertThat(c2.open).isFalse(); // 被服务端关闭

        // 正确 auth → auth_ok（含 server_time_ms）
        session.sendMessage(new TextMessage(om.writeValueAsString(Map.of("type", "auth", "token", token))));
        String authOk = c.next(5000);
        assertThat(authOk).contains("\"type\":\"auth_ok\"").contains("server_time_ms");

        // ping → pong
        session.sendMessage(new TextMessage("{\"type\":\"ping\"}"));
        String pong = c.next(5000);
        assertThat(pong).contains("\"type\":\"pong\"");

        // 真实处理：不存在的会话 → CONV_NOT_FOUND（发送链路已实现）
        session.sendMessage(new TextMessage("{\"type\":\"send\",\"conv_id\":1,\"kind\":\"text\",\"text\":\"hi\"}"));
        String ni = c.next(5000);
        assertThat(ni).contains("CONV_NOT_FOUND");

        // 未知类型 → UNKNOWN_TYPE
        session.sendMessage(new TextMessage("{\"type\":\"whatever\"}"));
        String unk = c.next(5000);
        assertThat(unk).contains("UNKNOWN_TYPE");

        session.close();
    }
}