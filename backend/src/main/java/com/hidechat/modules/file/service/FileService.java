package com.hidechat.modules.file.service;

import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import java.io.InputStream;

public interface FileService {

    FileUploadSignVO createUploadSign(String userUid, CreateUploadSignRequest request);

    void uploadContent(String userUid, String fileId, InputStream inputStream, long contentLength);

    FileInfoVO completeUpload(String userUid, CompleteFileUploadRequest request);

    FileInfoVO getFileInfo(String userUid, String fileId);

    PublicFileContent loadPublicContent(String fileId, long expiresAtEpochSeconds, String signature, boolean download);
}
