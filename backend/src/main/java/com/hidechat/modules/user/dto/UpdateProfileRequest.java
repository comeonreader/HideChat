package com.hidechat.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank
    private String nickname;

    private String avatarUrl;
}
