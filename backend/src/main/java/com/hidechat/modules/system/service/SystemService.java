package com.hidechat.modules.system.service;

import com.hidechat.modules.system.vo.DisguiseConfigVO;
import com.hidechat.modules.system.vo.FortuneTodayVO;

public interface SystemService {

    FortuneTodayVO getTodayFortune();

    DisguiseConfigVO getDisguiseConfig();
}
