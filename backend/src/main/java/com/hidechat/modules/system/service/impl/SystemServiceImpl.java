package com.hidechat.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.modules.system.service.SystemService;
import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import com.hidechat.modules.system.vo.LuckyNumberVerifyVO;
import com.hidechat.persistence.entity.ImDisguiseLuckyCodeEntity;
import com.hidechat.persistence.mapper.ImDisguiseLuckyCodeMapper;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SystemServiceImpl implements SystemService {

    private static final List<String> SUMMARIES = List.of(
        "今天适合整理情绪与节奏。",
        "适合把注意力放回真正重要的人和事。",
        "先慢下来，再决定是否回应外界噪声。"
    );
    private static final List<String> COLORS = List.of("蓝色", "青色", "米白");
    private static final List<String> DIRECTIONS = List.of("东南", "正北", "西南");
    private static final List<String> ADVICES = List.of(
        "在重要对话中保持耐心。",
        "给自己留一点不被打扰的时间。",
        "避免在疲惫时做冲动决定。"
    );

    private final ImDisguiseLuckyCodeMapper disguiseLuckyCodeMapper;
    private final Clock clock;

    public SystemServiceImpl(ImDisguiseLuckyCodeMapper disguiseLuckyCodeMapper, Clock clock) {
        this.disguiseLuckyCodeMapper = disguiseLuckyCodeMapper;
        this.clock = clock;
    }

    @Override
    public FortuneTodayVO getTodayFortune() {
        int seed = Math.floorMod(LocalDate.now(clock).getDayOfYear(), SUMMARIES.size());
        FortuneTodayVO vo = new FortuneTodayVO();
        vo.setTitle("今日运势");
        vo.setSummary(SUMMARIES.get(seed));
        vo.setLuckyColor(COLORS.get(seed));
        vo.setLuckyDirection(DIRECTIONS.get(seed));
        vo.setAdvice(ADVICES.get(seed));
        return vo;
    }

    @Override
    public DisguiseConfigVO getDisguiseConfig() {
        DisguiseConfigVO vo = new DisguiseConfigVO();
        vo.setSiteTitle("今日运势");
        vo.setShowFortuneInput(Boolean.TRUE);
        vo.setTheme("default");
        return vo;
    }

    @Override
    public LuckyNumberVerifyVO verifyLuckyNumber(String luckyNumber) {
        ImDisguiseLuckyCodeEntity activeCode = getActiveLuckyCode();
        if (activeCode == null) {
            throw new BusinessException(420202, "luckyCode 配置缺失");
        }
        if (!activeCode.getCodeValue().equals(luckyNumber.trim())) {
            throw new BusinessException(420201, "luckyCode 校验失败");
        }

        LuckyNumberVerifyVO vo = new LuckyNumberVerifyVO();
        vo.setMatched(Boolean.TRUE);
        return vo;
    }

    private ImDisguiseLuckyCodeEntity getActiveLuckyCode() {
        LocalDateTime now = LocalDateTime.now(clock);
        return disguiseLuckyCodeMapper.selectOne(new LambdaQueryWrapper<ImDisguiseLuckyCodeEntity>()
            .eq(ImDisguiseLuckyCodeEntity::getStatus, "active")
            .and(wrapper -> wrapper
                .isNull(ImDisguiseLuckyCodeEntity::getEffectiveStartAt)
                .or()
                .le(ImDisguiseLuckyCodeEntity::getEffectiveStartAt, now))
            .and(wrapper -> wrapper
                .isNull(ImDisguiseLuckyCodeEntity::getEffectiveEndAt)
                .or()
                .ge(ImDisguiseLuckyCodeEntity::getEffectiveEndAt, now))
            .orderByDesc(ImDisguiseLuckyCodeEntity::getUpdatedAt)
            .last("limit 1"));
    }
}
