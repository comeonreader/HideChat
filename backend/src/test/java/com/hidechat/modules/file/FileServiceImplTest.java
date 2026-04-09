package com.hidechat.modules.file;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.service.FileStorageProperties;
import com.hidechat.modules.file.service.FileUrlSignatureService;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.impl.FileServiceImpl;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.persistence.entity.ImFileEntity;
import com.hidechat.persistence.mapper.ImFileMapper;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @TempDir
    Path tempDir;

    @Mock
    private ImFileMapper fileMapper;

    private FileServiceImpl fileService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-08T00:00:00Z"), ZoneOffset.UTC);
        FileStorageProperties properties = new FileStorageProperties();
        properties.setStorageRoot(tempDir.toString());
        properties.setUrlSignatureSecret("test-secret");
        fileService = new FileServiceImpl(
            fileMapper,
            new IdGenerator(),
            new RandomValueGenerator(),
            properties,
            new FileUrlSignatureService(properties, clock),
            clock
        );
    }

    @Test
    void shouldCreateUploadSign() {
        CreateUploadSignRequest request = new CreateUploadSignRequest();
        request.setFileName("image.jpg");
        request.setMimeType("image/jpeg");
        request.setFileSize(123456L);
        request.setEncryptFlag(Boolean.TRUE);

        FileUploadSignVO result = fileService.createUploadSign("u_1001", request);

        assertEquals("image/jpeg", result.getHeaders().get("Content-Type"));
        assertEquals(true, result.getStorageKey().startsWith("chat/2026/04/08/"));
        verify(fileMapper).insert(any(ImFileEntity.class));
    }

    @Test
    void shouldRejectUnsupportedMimeType() {
        CreateUploadSignRequest request = new CreateUploadSignRequest();
        request.setFileName("test.exe");
        request.setMimeType("application/x-msdownload");
        request.setFileSize(1L);
        request.setEncryptFlag(Boolean.TRUE);

        assertThrows(BusinessException.class, () -> fileService.createUploadSign("u_1001", request));
    }

    @Test
    void shouldCompleteUploadAndReturnFileInfo() throws Exception {
        ImFileEntity entity = new ImFileEntity();
        entity.setId(1L);
        entity.setFileId("f_1001");
        entity.setUploaderUid("u_1001");
        entity.setFileName("image.jpg");
        entity.setStorageKey("chat/2026/04/08/f_1001.bin");
        entity.setMimeType("image/jpeg");
        entity.setFileSize(123L);
        entity.setEncryptFlag(Boolean.TRUE);
        when(fileMapper.selectOne(any())).thenReturn(entity);

        CompleteFileUploadRequest request = new CompleteFileUploadRequest();
        request.setFileId("f_1001");
        request.setStorageKey("chat/2026/04/08/f_1001.bin");
        request.setMimeType("image/jpeg");
        request.setFileSize(123456L);
        request.setEncryptFlag(Boolean.TRUE);

        Files.createDirectories(tempDir.resolve("chat/2026/04/08"));
        Files.write(tempDir.resolve("chat/2026/04/08/f_1001.bin"), new byte[123456]);

        FileInfoVO result = fileService.completeUpload("u_1001", request);

        assertEquals("f_1001", result.getFileId());
        org.junit.jupiter.api.Assertions.assertTrue(result.getAccessUrl().startsWith("/api/file/content/f_1001?expires="));
        verify(fileMapper).updateById(entity);
    }

    @Test
    void shouldUploadContentToLocalStorage() throws Exception {
        ImFileEntity entity = new ImFileEntity();
        entity.setFileId("f_2001");
        entity.setUploaderUid("u_1001");
        entity.setStorageKey("chat/2026/04/08/f_2001.jpg");
        entity.setFileSize(4L);
        when(fileMapper.selectOne(any())).thenReturn(entity);

        fileService.uploadContent("u_1001", "f_2001", new ByteArrayInputStream("test".getBytes()), 4L);

        assertEquals("test", Files.readString(tempDir.resolve("chat/2026/04/08/f_2001.jpg")));
    }
}
