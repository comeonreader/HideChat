package com.hidechat.modules.system;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.hidechat.modules.system.service.impl.SystemServiceImpl;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SystemServiceImplTest {

    private SystemServiceImpl systemService;

    @BeforeEach
    void setUp() {
        systemService = new SystemServiceImpl(Clock.fixed(
            Instant.parse("2026-04-08T00:00:00Z"),
            ZoneOffset.UTC
        ));
    }

    @Test
    void shouldReturnTodayFortune() {
        FortuneTodayVO vo = systemService.getTodayFortune();

        assertEquals("今日运势", vo.getTitle());
        assertNotNull(vo.getSummary());
        assertNotNull(vo.getAdvice());
    }

    @Test
    void shouldReturnDisguiseConfig() {
        DisguiseConfigVO vo = systemService.getDisguiseConfig();

        assertEquals("今日运势", vo.getSiteTitle());
        assertTrue(vo.getShowFortuneInput());
        assertEquals("default", vo.getTheme());
    }
}
