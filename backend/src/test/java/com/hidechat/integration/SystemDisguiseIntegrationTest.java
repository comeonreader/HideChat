package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.hidechat.persistence.entity.ImDisguiseLuckyCodeEntity;
import com.hidechat.persistence.mapper.ImDisguiseLuckyCodeMapper;
import java.time.LocalDateTime;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class SystemDisguiseIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ImDisguiseLuckyCodeMapper disguiseLuckyCodeMapper;

    @BeforeEach
    void setUp() {
        ImDisguiseLuckyCodeEntity entity = disguiseLuckyCodeMapper.selectById(202604100001L);
        if (entity == null) {
            entity = new ImDisguiseLuckyCodeEntity();
            entity.setId(202604100001L);
            entity.setCodeValue("2468");
            entity.setCreatedAt(LocalDateTime.now());
        }
        entity.setStatus("active");
        entity.setEffectiveStartAt(null);
        entity.setEffectiveEndAt(null);
        entity.setRemark("integration default");
        entity.setUpdatedAt(LocalDateTime.now());
        disguiseLuckyCodeMapper.insertOrUpdate(entity);
    }

    @Test
    void shouldVerifyLuckyNumberThroughApi() {
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/system/disguise/verify-lucky-number",
            HttpMethod.POST,
            jsonRequest("""
                {
                  "luckyNumber": "2468"
                }
                """),
            Map.class
        );

        assertEquals(200, response.getStatusCode().value());
        assertEquals(0, response.getBody().get("code"));
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        assertTrue((Boolean) data.get("matched"));
    }

    @Test
    void shouldReturnBusinessCodeWhenLuckyNumberMismatched() {
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/system/disguise/verify-lucky-number",
            HttpMethod.POST,
            jsonRequest("""
                {
                  "luckyNumber": "1111"
                }
                """),
            Map.class
        );

        assertEquals(200, response.getStatusCode().value());
        assertEquals(420201, response.getBody().get("code"));
    }

    private HttpEntity<String> jsonRequest(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
