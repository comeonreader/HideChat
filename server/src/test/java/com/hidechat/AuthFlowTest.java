package com.hidechat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** M1 验收：注册/登录/鉴权 全链路（真 PostgreSQL 16） */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://127.0.0.1:5434/hidechat_test",
        "spring.datasource.username=hidechat",
        "spring.datasource.password=hidechat",
        "app.rate.register-limit=10000",
        "app.rate.login-window-minutes=1000"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AuthFlowTest {

    // 401 响应需用 HttpClient5（JDK HttpURLConnection 对带 body 的 401 会抛 HttpRetryException）
    @LocalServerPort
    private int port;

    private final TestRestTemplate rest = httpClient();

    private String base() { return "http://127.0.0.1:" + port; }

    private static TestRestTemplate httpClient() {
        TestRestTemplate tr = new TestRestTemplate();
        tr.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return tr;
    }

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

    private Map<String, Object> register(String username, String password, String nickname) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("username", username);
        body.put("password", password);
        if (nickname != null) body.put("nickname", nickname);
        return rest.postForObject(base() + "/api/auth/register", body, Map.class);
    }

    @Test
    void registerThenLoginAndMe() {
        @SuppressWarnings("unchecked")
        Map<String, Object> reg = (Map<String, Object>) register("alice01", "secret123", "爱丽丝");
        assertThat(reg.get("token")).isNotNull();
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) reg.get("user");
        assertThat(user.get("username")).isEqualTo("alice01");
        assertThat(user.get("nickname")).isEqualTo("爱丽丝");
        assertThat(user.get("avatarVersion")).isEqualTo(0);

        // 用户名大小写不敏感重复注册
        ResponseEntity<Map> dup = rest.postForEntity(base() + "/api/auth/register",
                Map.of("username", "ALICE01", "password", "secret123"), Map.class);
        assertThat(dup.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(dup.getBody().get("code")).isEqualTo("USERNAME_TAKEN");

        // 非法用户名
        ResponseEntity<Map> bad = rest.postForEntity(base() + "/api/auth/register",
                Map.of("username", "ab", "password", "secret123"), Map.class);
        assertThat(bad.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // 登录成功
        ResponseEntity<Map> login = rest.postForEntity(base() + "/api/auth/login",
                Map.of("username", "alice01", "password", "secret123"), Map.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        String token = (String) login.getBody().get("token");

        // 错误密码
        ResponseEntity<Map> badLogin = rest.postForEntity(base() + "/api/auth/login",
                Map.of("username", "alice01", "password", "wrong-pass"), Map.class);
        assertThat(badLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(badLogin.getBody().get("code")).isEqualTo("BAD_CREDENTIALS");

        // /api/me 带 token
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        ResponseEntity<Map> me = rest.exchange(base() + "/api/me", HttpMethod.GET,
                new HttpEntity<>(null, h), Map.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().get("username")).isEqualTo("alice01");

        // 无 token -> 401
        ResponseEntity<Map> anon = rest.getForEntity(base() + "/api/me", Map.class);
        assertThat(anon.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // 伪造 token -> 401
        HttpHeaders badH = new HttpHeaders();
        badH.setBearerAuth("aaaa.bbbb.cccc");
        ResponseEntity<Map> forged = rest.exchange(base() + "/api/me", HttpMethod.GET,
                new HttpEntity<>(null, badH), Map.class);
        assertThat(forged.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void nicknameDefaultsToUsername() {
        @SuppressWarnings("unchecked")
        Map<String, Object> reg = (Map<String, Object>) register("bob01", "secret123", null);
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) reg.get("user");
        assertThat(user.get("nickname")).isEqualTo("bob01");
    }
}