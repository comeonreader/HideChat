package com.hidechat.modules.auth.service.impl;

import com.hidechat.modules.auth.service.EmailCodeSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LoggingEmailCodeSender implements EmailCodeSender {

    @Override
    public void send(String email, String bizType, String code) {
        log.info("Email code generated for email={}, bizType={}, code={}", email, bizType, code);
    }
}
