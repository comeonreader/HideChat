package com.hidechat.modules.user.controller;

import com.hidechat.common.response.ApiResponse;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.security.context.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/me")
    public ApiResponse<UserProfileVO> getProfile() {
        String userUid = currentUserProvider.getRequiredUserUid();
        return ApiResponse.success(userService.getUserProfile(userUid));
    }

    @PutMapping("/profile")
    public ApiResponse<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        userService.updateProfile(currentUserProvider.getRequiredUserUid(), request);
        return ApiResponse.success();
    }
}
