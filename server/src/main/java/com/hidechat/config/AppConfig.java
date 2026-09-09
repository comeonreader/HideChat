package com.hidechat.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** 全部业务可配置项（环境变量驱动，见 application.yml） */
@Component
public record AppConfig(
        @Value("${app.jwt-secret}") String jwtSecret,
        @Value("${app.jwt-days:30}") int jwtDays,
        @Value("${app.msg-ttl-minutes:20}") long msgTtlMinutes,
        @Value("${app.recall-window-minutes:2}") long recallWindowMinutes,
        @Value("${app.unread-max-days:30}") long unreadMaxDays,
        @Value("${app.sweep-interval-ms:30000}") long sweepIntervalMs,
        @Value("${app.upload-dir}") String uploadDir,
        @Value("${app.avatar-dir}") String avatarDir,
        @Value("${app.media.max-image-mb:20}") long maxImageMb,
        @Value("${app.media.max-video-mb:200}") long maxVideoMb,
        @Value("${app.media.max-voice-mb:5}") long maxVoiceMb,
        @Value("${app.media.max-avatar-mb:2}") long maxAvatarMb,
        @Value("${app.media.max-text-chars:2000}") int maxTextChars,
        @Value("${app.cors.allowed-origin-patterns:*}") String corsAllowedOriginPatterns,
        @Value("${app.rate.register-limit:10}") int registerLimit,
        @Value("${app.rate.register-window-minutes:60}") long registerWindowMinutes,
        @Value("${app.rate.login-attempts:5}") int loginAttempts,
        @Value("${app.rate.login-window-minutes:15}") long loginWindowMinutes) {
}