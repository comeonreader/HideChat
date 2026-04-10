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
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImFileEntity;
import com.hidechat.persistence.entity.ImMessageEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImFileMapper;
import com.hidechat.persistence.mapper.ImMessageMapper;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
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

    @Mock
    private ImMessageMapper messageMapper;

    @Mock
    private ImConversationMapper conversationMapper;

    private FileServiceImpl fileService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-04-08T00:00:00Z"), ZoneOffset.UTC);
        FileStorageProperties properties = new FileStorageProperties();
        properties.setStorageRoot(tempDir.toString());
        properties.setUrlSignatureSecret("test-secret");
        fileService = new FileServiceImpl(
            fileMapper,
            messageMapper,
            conversationMapper,
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
        org.junit.jupiter.api.Assertions.assertTrue(result.getDownloadUrl().contains("&download=true"));
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

    @Test
    void shouldAllowConversationParticipantToGetFileInfo() {
        when(fileMapper.selectOne(any())).thenReturn(buildFileEntity());
        when(messageMapper.selectList(any())).thenReturn(List.of(buildMessageEntity()));
        when(conversationMapper.selectCount(any())).thenReturn(1L);

        FileInfoVO result = fileService.getFileInfo("u_1002", "f_1001");

        assertEquals("f_1001", result.getFileId());
        assertEquals("pdf", result.getFileExt());
        assertEquals(Boolean.TRUE, result.getPreviewable());
        org.junit.jupiter.api.Assertions.assertTrue(result.getDownloadUrl().contains("&download=true"));
    }

    @Test
    void shouldRejectNonParticipantWhenGettingFileInfo() {
        when(fileMapper.selectOne(any())).thenReturn(buildFileEntity());
        when(messageMapper.selectList(any())).thenReturn(List.of(buildMessageEntity()));
        when(conversationMapper.selectCount(any())).thenReturn(0L);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> fileService.getFileInfo("u_9999", "f_1001"));

        assertEquals(403001, exception.getCode());
    }

    @Test
    void shouldAllowUploaderToGetFileInfoWithoutMessageRelation() {
        when(fileMapper.selectOne(any())).thenReturn(buildFileEntity());
        when(messageMapper.selectList(any())).thenReturn(List.of());

        FileInfoVO result = fileService.getFileInfo("u_1001", "f_1001");

        assertEquals("f_1001", result.getFileId());
    }

    private ImFileEntity buildFileEntity() {
        ImFileEntity entity = new ImFileEntity();
        entity.setId(1L);
        entity.setFileId("f_1001");
        entity.setUploaderUid("u_1001");
        entity.setFileName("project-draft-v3.pdf");
        entity.setMimeType("application/pdf");
        entity.setFileSize(123456L);
        entity.setStorageKey("chat/2026/04/08/f_1001.bin");
        entity.setEncryptFlag(Boolean.TRUE);
        return entity;
    }

    private ImMessageEntity buildMessageEntity() {
        ImMessageEntity entity = new ImMessageEntity();
        entity.setId(1L);
        entity.setConversationId("c_1001");
        entity.setFileId("f_1001");
        entity.setDeleted(Boolean.FALSE);
        return entity;
    }
}
