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
        log.info("开发提示：如需真实发送邮件，请配置以下环境变量：");
        log.info("1. 设置 HIDECHAT_MAIL_ENABLED=true");
        log.info("2. 配置 SPRING_MAIL_HOST 和 SPRING_MAIL_PORT（默认使用 MailPit: localhost:1025）");
        log.info("3. 访问 http://localhost:8025 查看测试邮件");
    }
}
