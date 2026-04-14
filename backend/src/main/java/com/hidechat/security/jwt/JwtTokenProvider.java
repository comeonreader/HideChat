package com.hidechat.security.jwt;

import com.hidechat.common.constant.AuthConstants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private final Clock clock;
    private final SecretKey signingKey;

    public JwtTokenProvider(JwtProperties jwtProperties, Clock clock) {
        this.jwtProperties = jwtProperties;
        this.clock = clock;
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(String userUid, String tokenId) {
        return createToken(userUid, tokenId, AuthConstants.TOKEN_TYPE_ACCESS, jwtProperties.getAccessTokenExpireSeconds());
    }

    public String createRefreshToken(String userUid, String tokenId) {
        return createToken(userUid, tokenId, AuthConstants.TOKEN_TYPE_REFRESH, jwtProperties.getRefreshTokenExpireSeconds());
    }

    public JwtClaims parse(String token) {
        Claims claims = Jwts.parser()
            .clock(() -> Date.from(clock.instant()))
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return new JwtClaims(
            claims.getSubject(),
            claims.getId(),
            claims.get("tokenType", String.class)
        );
    }

    public long getAccessTokenExpireSeconds() {
        return jwtProperties.getAccessTokenExpireSeconds();
    }

    public long getRefreshTokenExpireSeconds() {
        return jwtProperties.getRefreshTokenExpireSeconds();
    }

    private String createToken(String userUid, String tokenId, String tokenType, long expireSeconds) {
        Instant now = clock.instant();
        return Jwts.builder()
            .issuer(jwtProperties.getIssuer())
            .subject(userUid)
            .id(tokenId)
            .claim("tokenType", tokenType)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expireSeconds)))
            .signWith(signingKey)
            .compact();
    }
}
