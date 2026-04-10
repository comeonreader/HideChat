package com.hidechat.modules.contact;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hidechat.common.exception.BusinessException;
import com.hidechat.common.exception.GlobalExceptionHandler;
import com.hidechat.modules.contact.controller.ContactController;
import com.hidechat.modules.contact.dto.AddContactRequest;
import com.hidechat.modules.contact.service.ContactService;
import com.hidechat.modules.contact.vo.ContactItemVO;
import com.hidechat.modules.contact.vo.RecentContactItemVO;
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
class ContactControllerTest {

    @Mock
    private ContactService contactService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ContactController(contactService, currentUserProvider))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldAddContact() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        doNothing().when(contactService).addContact(any(), any(AddContactRequest.class));

        AddContactRequest request = new AddContactRequest();
        request.setPeerUid("u_1002");
        request.setRemarkName("Bob");

        mockMvc.perform(post("/api/contact/add")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void shouldListContacts() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        ContactItemVO vo = new ContactItemVO();
        vo.setPeerUid("u_1002");
        vo.setDisplayUserId("hide_1002");
        vo.setPeerNickname("Bob");
        when(contactService.listContacts("u_1001")).thenReturn(List.of(vo));

        mockMvc.perform(get("/api/contact/list"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].peerUid").value("u_1002"))
            .andExpect(jsonPath("$.data[0].displayUserId").value("hide_1002"));
    }

    @Test
    void shouldListRecentContacts() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        RecentContactItemVO vo = new RecentContactItemVO();
        vo.setPeerUid("u_1002");
        vo.setDisplayUserId("hide_1002");
        when(contactService.listRecentContacts("u_1001", 5)).thenReturn(List.of(vo));

        mockMvc.perform(get("/api/contact/recent").param("limit", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].peerUid").value("u_1002"))
            .andExpect(jsonPath("$.data[0].displayUserId").value("hide_1002"));
    }

    @Test
    void shouldRejectBlankPeerUid() throws Exception {
        AddContactRequest request = new AddContactRequest();
        request.setPeerUid(" ");

        mockMvc.perform(post("/api/contact/add")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(400001));
    }

    @Test
    void shouldReturnUnauthorizedWhenCurrentUserMissing() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenThrow(new BusinessException(401001, "未登录或 token 无效"));

        mockMvc.perform(get("/api/contact/list"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401001));
    }

    @Test
    void shouldReturnPermissionErrorFromRecentContactsService() throws Exception {
        when(currentUserProvider.getRequiredUserUid()).thenReturn("u_1001");
        when(contactService.listRecentContacts("u_1001", 1)).thenThrow(new BusinessException(403001, "无权限访问"));

        mockMvc.perform(get("/api/contact/recent").param("limit", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(403001));
    }
}
