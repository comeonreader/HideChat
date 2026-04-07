package com.hidechat.modules.auth.service;

public interface EmailCodeSender {

    void send(String email, String bizType, String code);
}
