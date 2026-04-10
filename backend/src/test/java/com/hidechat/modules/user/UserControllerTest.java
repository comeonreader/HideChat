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
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.user.controller.UserController;
import com.hidechat.modules.user.dto.UpdateProfileRequest;
import com.hidechat.modules.user.service.UserService;
import com.hidechat.modules.user.vo.UserProfileVO;
import com.hidechat.modules.user.vo.UserSearchItemVO;
import com.hidechat.security.context.CurrentUserProvider;
import java.util.List;
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
            .andExpect(jsonPath("$.data.displayUserId").value("hide_1001"))
            .andExpect(jsonPath("$.data.nickname").value("Alice"))
            .andExpect(jsonPath("$.data.email").doesNotExist());
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

    @Test
    void shouldSearchUsers() throws Exception {
        UserSearchItemVO result = new UserSearchItemVO();
        result.setUserUid("u_1002");
        result.setDisplayUserId("hide_1002");
        result.setNickname("Bob");
        result.setMatchType("nickname");
        result.setAlreadyAdded(Boolean.FALSE);

        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        when(userService.searchUsers("u_1001", "Bob")).thenReturn(List.of(result));

        mockMvc.perform(get("/api/user/search").param("keyword", "Bob"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].userUid").value("u_1002"))
            .andExpect(jsonPath("$.data[0].displayUserId").value("hide_1002"))
            .andExpect(jsonPath("$.data[0].alreadyAdded").value(false));
    }

    @Test
    void shouldReturnUnauthorizedForProfileWhenCurrentUserMissing() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenThrow(new BusinessException(401001, "未登录或 token 无效"));

        mockMvc.perform(get("/api/user/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401001));
    }

    private UserProfileVO buildProfile() {
        UserProfileVO vo = new UserProfileVO();
        vo.setUserUid("u_1001");
        vo.setDisplayUserId("hide_1001");
        vo.setNickname("Alice");
        vo.setAvatarUrl("https://cdn/avatar.png");
        return vo;
    }
}
