package com.hidechat.modules.file;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.file.controller.FileController;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.FileService;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.security.context.CurrentUserProvider;
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
        when(fileService.getFileInfo("u_1001", "f_1001")).thenReturn(vo);

        mockMvc.perform(get("/api/file/f_1001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.fileId").value("f_1001"));
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
}
