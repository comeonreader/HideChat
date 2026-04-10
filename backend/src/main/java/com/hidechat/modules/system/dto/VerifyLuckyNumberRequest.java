package com.hidechat.modules.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyLuckyNumberRequest {

    @NotBlank
    private String luckyNumber;
}
