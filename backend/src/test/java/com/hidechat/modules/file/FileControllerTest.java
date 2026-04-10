package com.hidechat.modules.file;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.file.controller.FileController;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.FileService;
import com.hidechat.modules.file.service.PublicFileContent;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.security.context.CurrentUserProvider;
import org.hamcrest.Matchers;
import org.springframework.core.io.ByteArrayResource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    @Mock
    private FileService fileService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FileController(fileService, currentUserProvider))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldCreateUploadSign() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        FileUploadSignVO vo = new FileUploadSignVO();
        vo.setFileId("f_1001");
        when(fileService.createUploadSign(any(), any(CreateUploadSignRequest.class))).thenReturn(vo);

        CreateUploadSignRequest request = new CreateUploadSignRequest();
        request.setFileName("image.jpg");
        request.setMimeType("image/jpeg");
        request.setFileSize(123456L);
        request.setEncryptFlag(Boolean.TRUE);

        mockMvc.perform(post("/api/file/upload-sign")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.fileId").value("f_1001"));
    }

    @Test
    void shouldCompleteUpload() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        FileInfoVO vo = new FileInfoVO();
        vo.setAccessUrl("/api/file/content/f_1001?expires=1&signature=test");
        when(fileService.completeUpload(any(), any(CompleteFileUploadRequest.class))).thenReturn(vo);

        CompleteFileUploadRequest request = new CompleteFileUploadRequest();
        request.setFileId("f_1001");
        request.setStorageKey("chat/2026/04/08/f_1001.bin");
        request.setMimeType("image/jpeg");
        request.setFileSize(123456L);
        request.setEncryptFlag(Boolean.TRUE);

        mockMvc.perform(post("/api/file/complete")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessUrl").value("/api/file/content/f_1001?expires=1&signature=test"));
    }

    @Test
    void shouldGetFileInfo() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        FileInfoVO vo = new FileInfoVO();
        vo.setFileId("f_1001");
        vo.setDownloadUrl("/api/file/content/f_1001?expires=1&signature=sig&download=true");
        when(fileService.getFileInfo("u_1001", "f_1001")).thenReturn(vo);

        mockMvc.perform(get("/api/file/f_1001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.fileId").value("f_1001"))
            .andExpect(jsonPath("$.data.downloadUrl").value("/api/file/content/f_1001?expires=1&signature=sig&download=true"));
    }

    @Test
    void shouldUploadBinaryContent() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");

        mockMvc.perform(put("/api/file/upload/f_1001")
                .contentType("image/jpeg")
                .content("file"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldDownloadContentWithAttachmentHeader() throws Exception {
        when(fileService.loadPublicContent("f_1001", 1L, "sig", true))
            .thenReturn(new PublicFileContent(new ByteArrayResource("file".getBytes()), "application/pdf", "test.pdf"));

        mockMvc.perform(get("/api/file/content/f_1001")
                .param("expires", "1")
                .param("signature", "sig")
                .param("download", "true"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", Matchers.containsString("attachment")));
    }

    @Test
    void shouldReturnUnauthorizedWhenCurrentUserMissing() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenThrow(new BusinessException(401001, "未登录或 token 无效"));

        mockMvc.perform(get("/api/file/f_1001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401001));
    }
}
