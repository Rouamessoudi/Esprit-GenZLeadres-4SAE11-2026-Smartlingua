package com.esprit.messaging.controller;

import com.esprit.messaging.dto.InvitationDTO;
import com.esprit.messaging.service.InvitationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InvitationController.class)
@AutoConfigureMockMvc(addFilters = false)
class InvitationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private InvitationService invitationService;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private com.esprit.messaging.repository.ConversationRepository conversationRepository;

    @MockitoBean
    private com.esprit.messaging.repository.UserRepository userRepository;

    @Test
    void createInvitation_returns201AndJsonBody() throws Exception {
        Long senderId = 1L;
        Long receiverId = 2L;
        InvitationDTO dto = new InvitationDTO();
        dto.setId(100L);
        dto.setSenderId(senderId);
        dto.setReceiverId(receiverId);
        dto.setMessage("Souhaite discuter");
        dto.setInvitationType("DISCUSSION");
        dto.setStatus("PENDING");
        dto.setCreatedAt(LocalDateTime.now());

        when(userRepository.existsById(receiverId)).thenReturn(true);
        when(invitationService.createInvitation(eq(senderId), eq(receiverId), anyString(), eq("DISCUSSION")))
            .thenReturn(dto);

        Map<String, Object> body = Map.of(
            "senderId", senderId,
            "receiverId", receiverId,
            "message", "Souhaite discuter",
            "invitationType", "DISCUSSION"
        );

        ResultActions result = mockMvc.perform(
            post("/messaging/invitations/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );

        result.andExpect(status().isCreated())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(100))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.senderId").value(1))
            .andExpect(jsonPath("$.receiverId").value(2));

        verify(messagingTemplate).convertAndSend(eq("/queue/invitations/2"), any(Object.class));
    }

    @Test
    void createInvitation_missingReceiverId_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "senderId", 1L,
            "message", "Hi"
        );

        mockMvc.perform(
            post("/messaging/invitations/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void createInvitation_selfInvite_returns400() throws Exception {
        when(userRepository.existsById(1L)).thenReturn(true);
        Map<String, Object> body = Map.of(
            "senderId", 1L,
            "receiverId", 1L,
            "message", "Hi",
            "invitationType", "DISCUSSION"
        );

        mockMvc.perform(
            post("/messaging/invitations/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());
    }
}
