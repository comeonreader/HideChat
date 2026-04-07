package com.hidechat.modules.user;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.user.controller.UserController;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.security.context.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new UserController(userService, currentUserProvider))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldGetCurrentUserProfile() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        when(userService.getUserProfile("u_1001")).thenReturn(buildProfile());

        mockMvc.perform(get("/api/user/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userUid").value("u_1001"))
            .andExpect(jsonPath("$.data.nickname").value("Alice"));
    }

    @Test
    void shouldUpdateProfile() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        doNothing().when(userService).updateProfile(any(), any(UpdateProfileRequest.class));

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNickname("Alice");
        request.setAvatarUrl("https://cdn/avatar.png");

        mockMvc.perform(put("/api/user/profile")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    private UserProfileVO buildProfile() {
        UserProfileVO vo = new UserProfileVO();
        vo.setUserUid("u_1001");
        vo.setNickname("Alice");
        vo.setAvatarUrl("https://cdn/avatar.png");
        vo.setEmail("alice@example.com");
        return vo;
    }
}
