package com.hidechat.security.jwt;

public record JwtClaims(String userUid, String tokenId, String tokenType) {
}
