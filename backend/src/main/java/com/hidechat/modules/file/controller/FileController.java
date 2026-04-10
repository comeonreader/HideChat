package com.hidechat.modules.file.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.FileService;
import com.hidechat.modules.file.service.PublicFileContent;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/upload-sign")
    public ApiResponse<FileUploadSignVO> uploadSign(@Valid @RequestBody CreateUploadSignRequest request) {
        return ApiResponse.success(fileService.createUploadSign(currentUserProvider.getRequiredUserUid(), request));
    }

    @PutMapping("/upload/{fileId}")
    public ApiResponse<Void> upload(@PathVariable String fileId, HttpServletRequest request) throws IOException {
        fileService.uploadContent(
            currentUserProvider.getRequiredUserUid(),
            fileId,
            request.getInputStream(),
            request.getContentLengthLong()
        );
        return ApiResponse.success();
    }

    @PostMapping("/complete")
    public ApiResponse<FileInfoVO> complete(@Valid @RequestBody CompleteFileUploadRequest request) {
        return ApiResponse.success(fileService.completeUpload(currentUserProvider.getRequiredUserUid(), request));
    }

    @GetMapping("/{fileId}")
    public ApiResponse<FileInfoVO> getById(@PathVariable String fileId) {
        return ApiResponse.success(fileService.getFileInfo(currentUserProvider.getRequiredUserUid(), fileId));
    }

    @GetMapping("/content/{fileId}")
    public ResponseEntity<Resource> content(@PathVariable String fileId,
                                            @RequestParam long expires,
                                            @RequestParam String signature,
                                            @RequestParam(defaultValue = "false") boolean download) {
        PublicFileContent fileContent = fileService.loadPublicContent(fileId, expires, signature, download);
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
            .contentType(MediaType.parseMediaType(fileContent.getMimeType()));
        if (download) {
            responseBuilder.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename(fileContent.getFileName())
                .build()
                .toString());
        }
        return responseBuilder.body(fileContent.getResource());
    }
}
