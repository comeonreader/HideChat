package com.hidechat.modules.contact.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddContactRequest {

    @NotBlank
    private String peerUid;

    private String remarkName;
}
