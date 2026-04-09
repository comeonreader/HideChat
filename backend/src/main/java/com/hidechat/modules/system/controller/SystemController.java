package com.hidechat.modules.system.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.system.service.SystemService;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemService systemService;

    @GetMapping("/fortune/today")
    public ApiResponse<FortuneTodayVO> getTodayFortune() {
        return ApiResponse.success(systemService.getTodayFortune());
    }

    @GetMapping("/disguise-config")
    public ApiResponse<DisguiseConfigVO> getDisguiseConfig() {
        return ApiResponse.success(systemService.getDisguiseConfig());
    }
}
