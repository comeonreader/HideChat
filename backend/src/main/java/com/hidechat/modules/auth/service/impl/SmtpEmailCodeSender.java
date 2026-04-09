package com.hidechat.modules.auth.service.impl;

import com.hidechat.modules.auth.service.EmailCodeSender;
import com.hidechat.modules.auth.service.MailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "hidechat.mail", name = "enabled", havingValue = "true")
public class SmtpEmailCodeSender implements EmailCodeSender {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public SmtpEmailCodeSender(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
    }

    @Override
    public void send(String email, String bizType, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(email);
            helper.setFrom(new InternetAddress(mailProperties.getFromAddress(), mailProperties.getFromName()).toString());
            helper.setSubject("[HideChat] 验证码");
            helper.setText(buildBody(bizType, code), false);
            mailSender.send(message);
        } catch (MailException | MessagingException | java.io.UnsupportedEncodingException exception) {
            throw new IllegalStateException("邮件发送失败", exception);
        }
    }

    private String buildBody(String bizType, String code) {
        return """
            你正在执行 HideChat 验证操作。

            业务类型：%s
            验证码：%s

            验证码有效期较短，请勿泄露给任何人。
            """.formatted(bizType, code);
    }
}
