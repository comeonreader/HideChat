package com.hidechat.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

class SecurityConfigTest {

    private final SecurityConfig securityConfig = new SecurityConfig();

    @Test
    void corsConfigurationShouldAllowLocalAndLanOrigins() {
        SecurityWebProperties properties = new SecurityWebProperties();

        CorsConfiguration configuration = resolveConfiguration(properties);

        assertEquals("http://localhost:5173", configuration.checkOrigin("http://localhost:5173"));
        assertEquals("http://192.168.1.9:5173", configuration.checkOrigin("http://192.168.1.9:5173"));
        assertEquals("http://10.0.0.5:3000", configuration.checkOrigin("http://10.0.0.5:3000"));
        assertEquals("http://172.20.10.5:4173", configuration.checkOrigin("http://172.20.10.5:4173"));
        assertNull(configuration.checkOrigin("http://example.com:5173"));
    }

    private CorsConfiguration resolveConfiguration(SecurityWebProperties properties) {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource(properties);
        return source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/system/fortune/today"));
    }
}
