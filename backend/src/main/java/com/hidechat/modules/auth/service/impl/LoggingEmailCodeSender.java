package com.hidechat.modules.auth.service.impl;

import com.hidechat.modules.auth.service.EmailCodeSender;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "hidechat.mail", name = "enabled", havingValue = "false", matchIfMissing = true)
public class LoggingEmailCodeSender implements EmailCodeSender {

    @Override
    public void send(String email, String bizType, String code) {
        log.warn("SMTP 未启用，验证码仅写入日志 email={}, bizType={}, code={}", email, bizType, code);
    }
}
