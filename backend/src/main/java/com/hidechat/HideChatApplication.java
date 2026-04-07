package com.hidechat;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.hidechat.persistence.mapper")
@SpringBootApplication
public class HideChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(HideChatApplication.class, args);
    }
}
