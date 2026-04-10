package com.hidechat.modules.auth;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.hidechat.modules.auth.service.MailProperties;
import com.hidechat.modules.auth.service.impl.SmtpEmailCodeSender;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class SmtpEmailCodeSenderTest {

    @Mock
    private JavaMailSender mailSender;

    private SmtpEmailCodeSender smtpEmailCodeSender;

    @BeforeEach
    void setUp() {
        MailProperties mailProperties = new MailProperties();
        mailProperties.setFromAddress("noreply@example.com");
        mailProperties.setFromName("HideChat");
        smtpEmailCodeSender = new SmtpEmailCodeSender(mailSender, mailProperties);
    }

    @Test
    void shouldSendEmailViaJavaMailSender() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        smtpEmailCodeSender.send("alice@example.com", "register", "123456");

        verify(mailSender).send(mimeMessage);
        assertTrue(mimeMessage.getSubject().contains("验证码"));
        assertTrue(mimeMessage.getContent().toString().contains("123456"));
        assertTrue(mimeMessage.getAllRecipients()[0].toString().contains("alice@example.com"));
        assertTrue(mimeMessage.getFrom()[0].toString().contains("noreply@example.com"));
    }

    @Test
    void shouldWrapMailFailure() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("smtp failed")).when(mailSender).send(mimeMessage);

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> smtpEmailCodeSender.send("alice@example.com", "register", "123456")
        );

        assertTrue(exception.getMessage().contains("邮件发送失败"));
    }
}
