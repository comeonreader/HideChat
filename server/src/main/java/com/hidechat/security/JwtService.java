package com.hidechat.security;

import com.hidechat.config.AppConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {
    private final AppConfig cfg;
    private final SecretKey key;

    public JwtService(AppConfig cfg) {
        this.cfg = cfg;
        this.key = Keys.hmacShaKeyFor(cfg.jwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String issue(long userId, String username, int tokenVersion) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("uname", username)
                .claim("tv", tokenVersion)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(cfg.jwtDays(), ChronoUnit.DAYS)))
                .signWith(key)
                .compact();
    }

    /** 解析失败抛异常；成功返回 claims */
    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }
}
