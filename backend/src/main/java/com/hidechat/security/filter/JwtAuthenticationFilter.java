package com.hidechat.security.filter;

import com.hidechat.common.constant.AuthConstants;
import com.hidechat.security.context.AuthenticatedUser;
import com.hidechat.security.jwt.JwtClaims;
import com.hidechat.security.jwt.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            try {
                JwtClaims claims = jwtTokenProvider.parse(token);
                if (AuthConstants.TOKEN_TYPE_ACCESS.equals(claims.tokenType())) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        claims.userUid(),
                        token,
                        List.of()
                    );
                    authentication.setDetails(new AuthenticatedUser(claims.userUid()));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
