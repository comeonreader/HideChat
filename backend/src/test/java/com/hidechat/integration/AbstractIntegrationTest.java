package com.hidechat.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.security.jwt.JwtTokenProvider;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
abstract class AbstractIntegrationTest {

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", IntegrationContainers.POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", IntegrationContainers.POSTGRES::getUsername);
        registry.add("spring.datasource.password", IntegrationContainers.POSTGRES::getPassword);
        registry.add("spring.data.redis.host", IntegrationContainers.REDIS::getHost);
        registry.add("spring.data.redis.port", () -> IntegrationContainers.REDIS.getMappedPort(6379));
    }

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected StringRedisTemplate stringRedisTemplate;

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void resetState() {
        jdbcTemplate.execute("""
            TRUNCATE TABLE
                hidechat.im_message_read_receipt,
                hidechat.im_unread_counter,
                hidechat.im_message,
                hidechat.im_file,
                hidechat.im_conversation,
                hidechat.im_contact,
                hidechat.im_refresh_token,
                hidechat.im_email_code,
                hidechat.im_user_auth,
                hidechat.im_user
            """);
        stringRedisTemplate.getRequiredConnectionFactory().getConnection().serverCommands().flushDb();
        try {
            Path uploadRoot = Path.of("./target/test-uploads");
            if (Files.exists(uploadRoot)) {
                Files.walk(uploadRoot)
                    .sorted(java.util.Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException exception) {
                            throw new IllegalStateException("Failed to clean test uploads", exception);
                        }
                    });
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to reset upload storage", exception);
        }
    }

    protected HttpHeaders bearerHeaders(String userUid) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenProvider.createAccessToken(userUid, "it-" + UUID.randomUUID()));
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    protected ResponseEntity<String> get(String path, HttpHeaders headers) {
        return restTemplate.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    protected ResponseEntity<String> post(String path, Object requestBody, HttpHeaders headers) {
        return restTemplate.exchange(path, HttpMethod.POST, new HttpEntity<>(requestBody, headers), String.class);
    }

    protected ResponseEntity<String> put(String path, Object requestBody, HttpHeaders headers) {
        return restTemplate.exchange(path, HttpMethod.PUT, new HttpEntity<>(requestBody, headers), String.class);
    }

    protected JsonNode readTree(ResponseEntity<String> response) {
        try {
            return objectMapper.readTree(response.getBody());
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to parse response body", exception);
        }
    }
}
