package com.esprit.messaging.service;

import com.esprit.messaging.dto.InvitationDTO;
import com.esprit.messaging.support.MysqlTestContainerBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InvitationServiceTest extends MysqlTestContainerBase {

    @Autowired
    private InvitationService invitationService;

    @Test
    void createInvitation_appliesDefaultInvitationTypeWhenNull() {
        Long senderId = 1L;
        Long receiverId = 2L;
        String message = "Test";
        String invitationType = null;

        InvitationDTO dto = invitationService.createInvitation(senderId, receiverId, message, invitationType);

        assertThat(dto).isNotNull();
        assertThat(dto.getInvitationType()).isEqualTo("DISCUSSION");
        assertThat(dto.getSenderId()).isEqualTo(senderId);
        assertThat(dto.getReceiverId()).isEqualTo(receiverId);
        assertThat(dto.getMessage()).isEqualTo(message);
        assertThat(dto.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void createInvitation_appliesDefaultInvitationTypeWhenBlank() {
        InvitationDTO dto = invitationService.createInvitation(1L, 2L, "Msg", "   ");

        assertThat(dto).isNotNull();
        assertThat(dto.getInvitationType()).isEqualTo("DISCUSSION");
    }

    @Test
    void createInvitation_keepsExplicitInvitationType() {
        InvitationDTO dto = invitationService.createInvitation(1L, 2L, "Msg", "DISCUSSION");

        assertThat(dto).isNotNull();
        assertThat(dto.getInvitationType()).isEqualTo("DISCUSSION");
    }

    @Test
    void createInvitation_returnsPendingWithCorrectSenderAndReceiver() {
        Long senderId = 10L;
        Long receiverId = 20L;
        InvitationDTO dto = invitationService.createInvitation(senderId, receiverId, "Hello", "DISCUSSION");

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isNotNull();
        assertThat(dto.getStatus()).isEqualTo("PENDING");
        assertThat(dto.getSenderId()).isEqualTo(senderId);
        assertThat(dto.getReceiverId()).isEqualTo(receiverId);
        assertThat(dto.getMessage()).isEqualTo("Hello");
        assertThat(dto.getInvitationType()).isEqualTo("DISCUSSION");
    }
}
