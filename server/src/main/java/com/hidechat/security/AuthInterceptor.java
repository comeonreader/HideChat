package com.hidechat.security;

import com.hidechat.error.ApiException;
import com.hidechat.user.User;
import com.hidechat.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** /api/** 的 Bearer JWT 校验；token_version 变更即失效（设计 11 节） */
@Component
public class AuthInterceptor implements HandlerInterceptor {
    public static final String ATTR_USER = "hidechat.user";

    private final JwtService jwt;
    private final UserRepository users;

    public AuthInterceptor(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw ApiException.unauthorized("UNAUTHENTICATED", "未登录或凭证缺失");
        }
        Claims claims;
        try {
            claims = jwt.parse(header.substring(7));
        } catch (Exception e) {
            throw ApiException.unauthorized("BAD_TOKEN", "凭证无效或已过期");
        }
        long uid = Long.parseLong(claims.getSubject());
        User user = users.findById(uid)
                .orElseThrow(() -> ApiException.unauthorized("BAD_TOKEN", "账号不存在"));
        int tv = claims.get("tv", Integer.class);
        if (tv != user.getTokenVersion()) {
            throw ApiException.unauthorized("TOKEN_STALE", "密码已变更，请重新登录");
        }
        req.setAttribute(ATTR_USER, user);
        return true;
    }
}
