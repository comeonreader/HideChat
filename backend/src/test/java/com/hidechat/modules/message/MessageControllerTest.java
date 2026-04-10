package com.hidechat.modules.message;

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
import com.hidechat.modules.message.controller.MessageController;
import com.hidechat.modules.message.dto.MarkMessageReadRequest;
import com.hidechat.modules.message.dto.SendMessageRequest;
import com.hidechat.modules.message.service.MessageService;
import com.hidechat.modules.message.vo.MessageHistoryVO;
import com.hidechat.modules.message.vo.MessageItemVO;
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
class MessageControllerTest {

    @Mock
    private MessageService messageService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new MessageController(messageService, currentUserProvider))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldSendMessage() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        MessageItemVO vo = new MessageItemVO();
        vo.setMessageId("m_1001");
        when(messageService.sendMessage(any(), any(SendMessageRequest.class))).thenReturn(vo);

        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId("c_1001");
        request.setReceiverUid("u_1002");
        request.setMessageType("text");
        request.setPayloadType("encrypted");
        request.setPayload("cipher");

        mockMvc.perform(post("/api/message/send")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.messageId").value("m_1001"));
    }

    @Test
    void shouldGetHistory() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        MessageItemVO item = new MessageItemVO();
        item.setMessageId("m_1001");
        MessageHistoryVO historyVO = new MessageHistoryVO();
        historyVO.setList(List.of(item));
        historyVO.setHasMore(false);
        when(messageService.listHistory("u_1001", "c_1001", null, 20)).thenReturn(historyVO);

        mockMvc.perform(get("/api/message/history")
                .param("conversationId", "c_1001")
                .param("pageSize", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.list[0].messageId").value("m_1001"));
    }

    @Test
    void shouldMarkRead() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        doNothing().when(messageService).markMessagesRead(any(), any(MarkMessageReadRequest.class));

        MarkMessageReadRequest request = new MarkMessageReadRequest();
        request.setConversationId("c_1001");
        request.setMessageIds(List.of("m_1001"));

        mockMvc.perform(post("/api/message/read")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldRejectMissingConversationIdForHistory() throws Exception {
        mockMvc.perform(get("/api/message/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(400001));
    }

    @Test
    void shouldReturnUnauthorizedWhenCurrentUserMissing() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenThrow(new BusinessException(401001, "未登录或 token 无效"));

        mockMvc.perform(get("/api/message/history").param("conversationId", "c_1001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401001));
    }
}
