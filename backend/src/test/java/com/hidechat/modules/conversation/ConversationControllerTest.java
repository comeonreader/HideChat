package com.hidechat.modules.conversation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.conversation.controller.ConversationController;
import com.hidechat.modules.conversation.dto.ClearUnreadRequest;
import com.hidechat.modules.conversation.dto.CreateSingleConversationRequest;
import com.hidechat.modules.conversation.service.ConversationService;
import com.hidechat.modules.conversation.vo.ConversationItemVO;
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
class ConversationControllerTest {

    @Mock
    private ConversationService conversationService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ConversationController(conversationService, currentUserProvider))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldCreateSingleConversation() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        ConversationItemVO vo = new ConversationItemVO();
        vo.setConversationId("c_1001");
        vo.setPeerUid("u_1002");
        when(conversationService.createSingleConversation(any(), any(CreateSingleConversationRequest.class))).thenReturn(vo);

        CreateSingleConversationRequest request = new CreateSingleConversationRequest();
        request.setPeerUid("u_1002");

        mockMvc.perform(post("/api/conversation/single")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.conversationId").value("c_1001"));
    }

    @Test
    void shouldListConversations() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        ConversationItemVO vo = new ConversationItemVO();
        vo.setConversationId("c_1001");
        vo.setLastMessagePreview("[文件消息]");
        vo.setPreviewStrategy("masked");
        when(conversationService.listConversations("u_1001")).thenReturn(List.of(vo));

        mockMvc.perform(get("/api/conversation/list"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].conversationId").value("c_1001"))
            .andExpect(jsonPath("$.data[0].lastMessagePreview").value("[文件消息]"))
            .andExpect(jsonPath("$.data[0].previewStrategy").value("masked"));
    }

    @Test
    void shouldClearUnread() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        doNothing().when(conversationService).clearUnread(any(), any(ClearUnreadRequest.class));

        ClearUnreadRequest request = new ClearUnreadRequest();
        request.setConversationId("c_1001");

        mockMvc.perform(post("/api/conversation/clear-unread")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldReturnUnauthorizedWhenCurrentUserMissing() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenThrow(new BusinessException(401001, "未登录或 token 无效"));

        mockMvc.perform(get("/api/conversation/list"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401001));
    }
}
