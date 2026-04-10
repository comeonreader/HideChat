package com.hidechat.modules.system;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.hidechat.common.exception.BusinessException;
import com.hidechat.modules.system.service.impl.SystemServiceImpl;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import com.hidechat.modules.system.vo.LuckyNumberVerifyVO;
import com.hidechat.persistence.entity.ImDisguiseLuckyCodeEntity;
import com.hidechat.persistence.mapper.ImDisguiseLuckyCodeMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class SystemServiceImplTest {

    private SystemServiceImpl systemService;
    private ImDisguiseLuckyCodeMapper disguiseLuckyCodeMapper;

    @BeforeEach
    void setUp() {
        disguiseLuckyCodeMapper = Mockito.mock(ImDisguiseLuckyCodeMapper.class);
        systemService = new SystemServiceImpl(disguiseLuckyCodeMapper, Clock.fixed(
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

    @Test
    void shouldVerifyLuckyNumberWhenMatched() {
        ImDisguiseLuckyCodeEntity entity = new ImDisguiseLuckyCodeEntity();
        entity.setCodeValue("2468");
        entity.setUpdatedAt(LocalDateTime.parse("2026-04-08T00:00:00"));
        when(disguiseLuckyCodeMapper.selectOne(Mockito.any())).thenReturn(entity);

        LuckyNumberVerifyVO vo = systemService.verifyLuckyNumber("2468");

        assertTrue(vo.getMatched());
    }

    @Test
    void shouldThrowWhenLuckyNumberMismatched() {
        ImDisguiseLuckyCodeEntity entity = new ImDisguiseLuckyCodeEntity();
        entity.setCodeValue("2468");
        when(disguiseLuckyCodeMapper.selectOne(Mockito.any())).thenReturn(entity);

        BusinessException exception = assertThrows(BusinessException.class, () -> systemService.verifyLuckyNumber("9999"));

        assertEquals(420201, exception.getCode());
    }

    @Test
    void shouldThrowWhenLuckyCodeConfigMissing() {
        when(disguiseLuckyCodeMapper.selectOne(Mockito.any())).thenReturn(null);

        BusinessException exception = assertThrows(BusinessException.class, () -> systemService.verifyLuckyNumber("2468"));

        assertEquals(420202, exception.getCode());
    }
}
