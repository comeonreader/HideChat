package com.hidechat.modules.system;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.system.controller.SystemController;
import com.hidechat.modules.system.service.SystemService;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import com.hidechat.modules.system.vo.LuckyNumberVerifyVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SystemControllerTest {

    @Mock
    private SystemService systemService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new SystemController(systemService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    void shouldGetTodayFortune() throws Exception {
        FortuneTodayVO vo = new FortuneTodayVO();
        vo.setTitle("今日运势");
        when(systemService.getTodayFortune()).thenReturn(vo);

        mockMvc.perform(get("/api/system/fortune/today"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("今日运势"));
    }

    @Test
    void shouldGetDisguiseConfig() throws Exception {
        DisguiseConfigVO vo = new DisguiseConfigVO();
        vo.setSiteTitle("今日运势");
        when(systemService.getDisguiseConfig()).thenReturn(vo);

        mockMvc.perform(get("/api/system/disguise-config"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.siteTitle").value("今日运势"));
    }

    @Test
    void shouldVerifyLuckyNumber() throws Exception {
        LuckyNumberVerifyVO vo = new LuckyNumberVerifyVO();
        vo.setMatched(Boolean.TRUE);
        when(systemService.verifyLuckyNumber("2468")).thenReturn(vo);

        mockMvc.perform(post("/api/system/disguise/verify-lucky-number")
                .contentType("application/json")
                .content("""
                    {
                      "luckyNumber": "2468"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.matched").value(true));
    }
}
