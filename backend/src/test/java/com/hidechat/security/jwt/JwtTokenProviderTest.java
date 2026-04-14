package com.hidechat.security.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {

    @Test
    void shouldParseTokenUsingConfiguredClock() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-07T00:00:00Z"), ZoneOffset.UTC);

        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setIssuer("hidechat");
        jwtProperties.setSecret("hidechat-dev-secret-key-hidechat-dev-secret-key-2026");
        jwtProperties.setAccessTokenExpireSeconds(7200L);
        jwtProperties.setRefreshTokenExpireSeconds(604800L);

        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(jwtProperties, fixedClock);
        String refreshToken = jwtTokenProvider.createRefreshToken("u_1001", "token-1");

        JwtClaims claims = jwtTokenProvider.parse(refreshToken);

        assertEquals("u_1001", claims.userUid());
        assertEquals("token-1", claims.tokenId());
        assertEquals("refresh", claims.tokenType());
    }
}
