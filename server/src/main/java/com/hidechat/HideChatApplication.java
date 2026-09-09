package com.hidechat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HideChatApplication {
    public static void main(String[] args) {
        SpringApplication.run(HideChatApplication.class, args);
    }
}
