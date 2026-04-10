package com.hidechat.modules.system.service;

import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;
import com.hidechat.modules.system.vo.LuckyNumberVerifyVO;

public interface SystemService {

    FortuneTodayVO getTodayFortune();

    DisguiseConfigVO getDisguiseConfig();

    LuckyNumberVerifyVO verifyLuckyNumber(String luckyNumber);
}
