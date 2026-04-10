package com.hidechat.integration;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class FileUploadIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldUploadCompleteAndDownloadPublicFile() {
        jdbcTemplate.update("""
            insert into hidechat.im_user (id, user_uid, nickname, created_at, updated_at)
            values (1, 'u_1001', 'Reader', now(), now())
            """);

        HttpHeaders headers = bearerHeaders("u_1001");

        ResponseEntity<String> signResponse = post("/api/file/upload-sign", Map.of(
            "fileName", "photo.png",
            "mimeType", "image/png",
            "fileSize", 4,
            "encryptFlag", false
        ), headers);

        String fileId = readTree(signResponse).path("data").path("fileId").asText();
        String storageKey = readTree(signResponse).path("data").path("storageKey").asText();
        String uploadUrl = readTree(signResponse).path("data").path("uploadUrl").asText();

        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.setBearerAuth(jwtTokenProvider.createAccessToken("u_1001", "upload-it"));
        uploadHeaders.setContentType(MediaType.IMAGE_PNG);
        ResponseEntity<String> uploadResponse = restTemplate.exchange(
            uploadUrl,
            HttpMethod.PUT,
            new HttpEntity<>("test".getBytes(), uploadHeaders),
            String.class
        );
        assertEquals(200, uploadResponse.getStatusCode().value());

        ResponseEntity<String> completeResponse = post("/api/file/complete", Map.of(
            "fileId", fileId,
            "storageKey", storageKey,
            "mimeType", "image/png",
            "fileSize", 4,
            "encryptFlag", false
        ), headers);

        String accessUrl = readTree(completeResponse).path("data").path("accessUrl").asText();
        String downloadUrl = readTree(completeResponse).path("data").path("downloadUrl").asText();
        ResponseEntity<byte[]> contentResponse = restTemplate.exchange(accessUrl, HttpMethod.GET, null, byte[].class);

        assertEquals(200, contentResponse.getStatusCode().value());
        assertEquals(MediaType.IMAGE_PNG, contentResponse.getHeaders().getContentType());
        assertArrayEquals("test".getBytes(), contentResponse.getBody());
        assertTrue(downloadUrl.contains("download=true"));
    }
}
