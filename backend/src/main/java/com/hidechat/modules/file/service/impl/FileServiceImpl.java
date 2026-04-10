package com.hidechat.modules.file.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.util.IdGenerator;
import com.hidechat.common.util.RandomValueGenerator;
import com.hidechat.modules.file.dto.CompleteFileUploadRequest;
import com.hidechat.modules.file.dto.CreateUploadSignRequest;
import com.hidechat.modules.file.service.FileService;
import com.hidechat.modules.file.service.FileStorageProperties;
import com.hidechat.modules.file.service.FileUrlSignatureService;
import com.hidechat.modules.file.service.PublicFileContent;
import com.hidechat.modules.file.vo.FileInfoVO;
import com.hidechat.modules.file.vo.FileUploadSignVO;
import com.hidechat.persistence.entity.ImConversationEntity;
import com.hidechat.persistence.entity.ImFileEntity;
import com.hidechat.persistence.entity.ImMessageEntity;
import com.hidechat.persistence.mapper.ImConversationMapper;
import com.hidechat.persistence.mapper.ImFileMapper;
import com.hidechat.persistence.mapper.ImMessageMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FileServiceImpl implements FileService {

    private final ImFileMapper fileMapper;
    private final ImMessageMapper messageMapper;
    private final ImConversationMapper conversationMapper;
    private final IdGenerator idGenerator;
    private final RandomValueGenerator randomValueGenerator;
    private final FileStorageProperties fileStorageProperties;
    private final FileUrlSignatureService fileUrlSignatureService;
    private final Clock clock;

    public FileServiceImpl(ImFileMapper fileMapper,
                           ImMessageMapper messageMapper,
                           ImConversationMapper conversationMapper,
                           IdGenerator idGenerator,
                           RandomValueGenerator randomValueGenerator,
                           FileStorageProperties fileStorageProperties,
                           FileUrlSignatureService fileUrlSignatureService,
                           Clock clock) {
        this.fileMapper = fileMapper;
        this.messageMapper = messageMapper;
        this.conversationMapper = conversationMapper;
        this.idGenerator = idGenerator;
        this.randomValueGenerator = randomValueGenerator;
        this.fileStorageProperties = fileStorageProperties;
        this.fileUrlSignatureService = fileUrlSignatureService;
        this.clock = clock;
    }

    @Override
    @Transactional
    public FileUploadSignVO createUploadSign(String userUid, CreateUploadSignRequest request) {
        validateUploadRequest(request.getMimeType(), request.getFileSize());
        LocalDateTime now = LocalDateTime.now(clock);
        String fileId = randomValueGenerator.fileId();
        String storageKey = buildStorageKey(fileId, request.getFileName());

        ImFileEntity entity = new ImFileEntity();
        entity.setId(idGenerator.nextId());
        entity.setFileId(fileId);
        entity.setUploaderUid(userUid);
        entity.setFileName(request.getFileName());
        entity.setMimeType(request.getMimeType());
        entity.setFileSize(request.getFileSize());
        entity.setStorageKey(storageKey);
        entity.setEncryptFlag(request.getEncryptFlag());
        entity.setCreatedAt(now);
        fileMapper.insert(entity);

        FileUploadSignVO vo = new FileUploadSignVO();
        vo.setFileId(fileId);
        vo.setStorageKey(storageKey);
        vo.setUploadUrl("/api/file/upload/" + fileId);
        vo.setHeaders(Map.of("Content-Type", request.getMimeType()));
        return vo;
    }

    @Override
    public void uploadContent(String userUid, String fileId, InputStream inputStream, long contentLength) {
        ImFileEntity entity = requireOwnedFile(fileId, userUid);
        long expectedSize = entity.getFileSize() == null ? 0L : entity.getFileSize();
        if (contentLength > 0 && expectedSize > 0 && contentLength != expectedSize) {
            throw new BusinessException(400001, "上传文件大小与预签名不一致");
        }
        Path targetPath = resolveStoragePath(entity.getStorageKey());
        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(inputStream, targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            long actualSize = Files.size(targetPath);
            if (expectedSize > 0 && actualSize != expectedSize) {
                Files.deleteIfExists(targetPath);
                throw new BusinessException(400001, "上传文件大小校验失败");
            }
        } catch (IOException exception) {
            throw new BusinessException(500003, "文件上传失败");
        }
    }

    @Override
    @Transactional
    public FileInfoVO completeUpload(String userUid, CompleteFileUploadRequest request) {
        validateUploadRequest(request.getMimeType(), request.getFileSize());
        ImFileEntity entity = requireOwnedFile(request.getFileId(), userUid);
        if (!Objects.equals(entity.getStorageKey(), request.getStorageKey())) {
            throw new BusinessException(420301, "storageKey 不匹配");
        }
        Path filePath = resolveStoragePath(request.getStorageKey());
        try {
            if (!Files.exists(filePath)) {
                throw new BusinessException(404001, "上传文件不存在");
            }
            if (Files.size(filePath) != request.getFileSize()) {
                throw new BusinessException(400001, "文件大小校验失败");
            }
        } catch (IOException exception) {
            throw new BusinessException(500003, "文件服务异常");
        }
        entity.setMimeType(request.getMimeType());
        entity.setFileSize(request.getFileSize());
        entity.setEncryptFlag(request.getEncryptFlag());
        entity.setAccessUrl(buildSignedAccessUrl(entity.getFileId()));
        fileMapper.updateById(entity);
        return toFileInfo(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public FileInfoVO getFileInfo(String userUid, String fileId) {
        ImFileEntity entity = requireConversationParticipantFile(fileId, userUid);
        entity.setAccessUrl(buildSignedAccessUrl(entity.getFileId()));
        return toFileInfo(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicFileContent loadPublicContent(String fileId,
                                               long expiresAtEpochSeconds,
                                               String signature,
                                               boolean download) {
        if (!fileUrlSignatureService.verifyDownload(fileId, expiresAtEpochSeconds, signature)) {
            throw new BusinessException(401001, "文件访问签名无效");
        }
        ImFileEntity entity = requireFile(fileId);
        Path filePath = resolveStoragePath(entity.getStorageKey());
        if (!Files.exists(filePath)) {
            throw new BusinessException(404001, "文件不存在");
        }
        return new PublicFileContent(new FileSystemResource(filePath), entity.getMimeType(), entity.getFileName());
    }

    private ImFileEntity requireOwnedFile(String fileId, String userUid) {
        ImFileEntity entity = requireFile(fileId);
        if (!Objects.equals(entity.getUploaderUid(), userUid)) {
            throw new BusinessException(403001, "无权限访问");
        }
        return entity;
    }

    private ImFileEntity requireConversationParticipantFile(String fileId, String userUid) {
        ImFileEntity entity = requireFile(fileId);
        List<ImMessageEntity> fileMessages = messageMapper.selectList(new LambdaQueryWrapper<ImMessageEntity>()
            .eq(ImMessageEntity::getFileId, fileId)
            .eq(ImMessageEntity::getDeleted, Boolean.FALSE));
        if (fileMessages.isEmpty()) {
            if (Objects.equals(entity.getUploaderUid(), userUid)) {
                return entity;
            }
            throw new BusinessException(403001, "无权限访问");
        }

        List<String> conversationIds = fileMessages.stream()
            .map(ImMessageEntity::getConversationId)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();
        if (conversationIds.isEmpty()) {
            throw new BusinessException(403001, "无权限访问");
        }

        long matchedConversationCount = conversationMapper.selectCount(new LambdaQueryWrapper<ImConversationEntity>()
            .in(ImConversationEntity::getConversationId, conversationIds)
            .and(wrapper -> wrapper.eq(ImConversationEntity::getUserAUid, userUid)
                .or()
                .eq(ImConversationEntity::getUserBUid, userUid)));
        if (matchedConversationCount <= 0) {
            throw new BusinessException(403001, "无权限访问");
        }
        return entity;
    }

    private ImFileEntity requireFile(String fileId) {
        ImFileEntity entity = fileMapper.selectOne(new LambdaQueryWrapper<ImFileEntity>()
            .eq(ImFileEntity::getFileId, fileId));
        if (entity == null) {
            throw new BusinessException(404001, "文件不存在");
        }
        return entity;
    }

    private void validateUploadRequest(String mimeType, Long fileSize) {
        if (!StringUtils.hasText(mimeType) || !isSupportedMimeType(mimeType)) {
            throw new BusinessException(400001, "文件类型不支持");
        }
        if (fileSize == null || fileSize <= 0 || fileSize > fileStorageProperties.getMaxFileSizeBytes()) {
            throw new BusinessException(400001, "文件大小不合法");
        }
    }

    private boolean isSupportedMimeType(String mimeType) {
        return mimeType.startsWith("image/")
            || mimeType.equals("application/pdf")
            || mimeType.equals("text/plain")
            || mimeType.equals("application/octet-stream");
    }

    private String buildStorageKey(String fileId, String fileName) {
        LocalDate date = LocalDate.now(clock);
        return "chat/" + date.getYear()
            + "/" + String.format("%02d", date.getMonthValue())
            + "/" + String.format("%02d", date.getDayOfMonth())
            + "/" + fileId + resolveExtension(fileName);
    }

    private String buildSignedAccessUrl(String fileId) {
        long expiresAt = fileUrlSignatureService.buildExpiryEpochSeconds();
        String signature = fileUrlSignatureService.signDownload(fileId, expiresAt);
        return "/api/file/content/" + fileId + "?expires=" + expiresAt + "&signature=" + signature;
    }

    private String buildSignedDownloadUrl(String fileId) {
        return buildSignedAccessUrl(fileId) + "&download=true";
    }

    private Path resolveStoragePath(String storageKey) {
        Path storageRoot = Path.of(fileStorageProperties.getStorageRoot()).toAbsolutePath().normalize();
        Path resolved = storageRoot.resolve(storageKey).normalize();
        if (!resolved.startsWith(storageRoot)) {
            throw new BusinessException(400001, "非法文件路径");
        }
        return resolved;
    }

    private String resolveExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return ".bin";
        }
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == fileName.length() - 1) {
            return ".bin";
        }
        String extension = fileName.substring(lastDot).toLowerCase();
        return extension.length() > 12 ? ".bin" : extension;
    }

    private FileInfoVO toFileInfo(ImFileEntity entity) {
        FileInfoVO vo = new FileInfoVO();
        vo.setFileId(entity.getFileId());
        vo.setFileName(entity.getFileName());
        vo.setFileExt(resolveFileExtensionWithoutDot(entity.getFileName()));
        vo.setPreviewable(isPreviewable(entity.getMimeType()));
        vo.setMimeType(entity.getMimeType());
        vo.setFileSize(entity.getFileSize());
        vo.setAccessUrl(entity.getAccessUrl());
        vo.setDownloadUrl(buildSignedDownloadUrl(entity.getFileId()));
        vo.setEncryptFlag(Boolean.TRUE.equals(entity.getEncryptFlag()));
        return vo;
    }

    private String resolveFileExtensionWithoutDot(String fileName) {
        String extension = resolveExtension(fileName);
        return extension.startsWith(".") ? extension.substring(1) : extension;
    }

    private boolean isPreviewable(String mimeType) {
        return StringUtils.hasText(mimeType)
            && (mimeType.startsWith("image/") || mimeType.equals("application/pdf") || mimeType.startsWith("text/"));
    }
}
