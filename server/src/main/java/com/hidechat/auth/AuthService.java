package com.hidechat.auth;

import com.hidechat.config.AppConfig;
import com.hidechat.error.ApiException;
import com.hidechat.security.JwtService;
import com.hidechat.user.User;
import com.hidechat.user.UserDto;
import com.hidechat.user.UserRepository;
import com.hidechat.web.RateLimiter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {
    private final UserRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
    private final JwtService jwt;
    private final AppConfig cfg;
    private final RateLimiter registerLimiter = new RateLimiter();
    private final RateLimiter loginLimiter = new RateLimiter();

    public AuthService(UserRepository users, JwtService jwt, AppConfig cfg) {
        this.users = users;
        this.jwt = jwt;
        this.cfg = cfg;
    }

    @Transactional
    public Map<String, Object> register(AuthDtos.RegisterRequest req, String ip) {
        if (!registerLimiter.tryAcquire("reg:" + ip, cfg.registerLimit(),
                cfg.registerWindowMinutes() * 60_000L)) {
            throw ApiException.tooMany("RATE_LIMITED", "注册过于频繁，请稍后再试");
        }
        String username = req.username().trim().toLowerCase();
        if (!username.matches("^[a-z0-9_]{3,20}$")) {
            throw ApiException.badRequest("BAD_USERNAME", "用户名须为 3-20 位字母/数字/下划线");
        }
        if (users.existsByUsername(username)) {
            throw ApiException.conflict("USERNAME_TAKEN", "该用户名已被注册");
        }
        String nickname = req.nickname() == null ? "" : req.nickname().trim();
        if (nickname.length() > 30) {
            throw ApiException.badRequest("BAD_NICKNAME", "昵称最长 30 字");
        }
        if (nickname.isEmpty()) {
            nickname = username;
        }
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setNickname(nickname);
        users.save(u);
        // 注册即登录（免验证码场景的便利设计）
        return tokenBody(u);
    }

    @Transactional
    public Map<String, Object> login(AuthDtos.LoginRequest req) {
        String username = req.username().trim().toLowerCase();
        String key = "login:" + username;
        if (!loginLimiter.tryAcquire(key, cfg.loginAttempts(),
                cfg.loginWindowMinutes() * 60_000L)) {
            throw ApiException.tooMany("TOO_MANY_ATTEMPTS", "失败次数过多，请 15 分钟后再试");
        }
        User u = users.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("BAD_CREDENTIALS", "用户名或密码错误"));
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw ApiException.unauthorized("BAD_CREDENTIALS", "用户名或密码错误");
        }
        loginLimiter.clear(key);
        u.setLastLoginAt(Instant.now());
        return tokenBody(u);
    }

    public Map<String, Object> tokenBody(User u) {
        String token = jwt.issue(u.getId(), u.getUsername(), u.getTokenVersion());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("token", token);
        body.put("user", UserDto.of(u));
        return body;
    }
}
