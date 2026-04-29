package com.esprit.messaging.services;

import com.esprit.messaging.client.UserDirectoryClient;
import com.esprit.messaging.dto.MessagingDtos;
import com.esprit.messaging.dto.UserSummary;
import com.esprit.messaging.entities.ConversationEntity;
import com.esprit.messaging.entities.MessageEntity;
import com.esprit.messaging.repositories.ConversationRepository;
import com.esprit.messaging.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MessagingRelationService {
    private static final Logger log = LoggerFactory.getLogger(MessagingRelationService.class);

    private final UserDirectoryClient userDirectoryClient;
    private final AuthContextService auth;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final String mainTeacherUsername;

    public MessagingRelationService(
        UserDirectoryClient userDirectoryClient,
        AuthContextService auth,
        ConversationRepository conversationRepository,
        MessageRepository messageRepository,
        @Value("${messaging.main-teacher-username:teacher}") String mainTeacherUsername
    ) {
        this.userDirectoryClient = userDirectoryClient;
        this.auth = auth;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.mainTeacherUsername = mainTeacherUsername;
    }

    public MessagingDtos.RoleSnapshotDto roleSnapshot() {
        return new MessagingDtos.RoleSnapshotDto(auth.keycloakSub(), auth.username(), auth.roles());
    }

    public List<MessagingDtos.ParticipantDto> teacherStudents() {
        UserSummary current = requireCurrentUser();
        ensureTeacher(current);
        return loadAllUsers().stream()
            .filter(u -> "STUDENT".equals(u.normalizedRole()))
            .map(this::toParticipant)
            .sorted(Comparator.comparing(MessagingDtos.ParticipantDto::displayName, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    public MessagingDtos.ParticipantDto studentTeacher() {
        UserSummary current = requireCurrentUser();
        ensureStudent(current);
        UserSummary teacher = resolveMainTeacher();
        return toParticipant(teacher);
    }

    public List<MessagingDtos.ConversationDto> conversationsForCurrentUser() {
        UserSummary current = requireCurrentUser();
        Map<Long, UserSummary> usersById = safeLoadAllUsers().stream()
            .collect(Collectors.toMap(UserSummary::id, u -> u, (a, b) -> a));

        if ("TEACHER".equals(current.normalizedRole())) {
            List<ConversationEntity> existing = conversationRepository.findByTeacherIdOrderByCreatedAtDesc(current.id());
            return existing.stream().map(c -> toConversationDto(c, usersById)).toList();
        }

        if ("STUDENT".equals(current.normalizedRole())) {
            UserSummary teacher = resolveMainTeacher();
            ConversationEntity c = conversationRepository
                .findByTeacherIdAndStudentId(teacher.id(), current.id())
                .orElseGet(() -> createConversation(teacher.id(), current.id()));
            return List.of(toConversationDto(c, usersById));
        }

        if ("ADMIN".equals(current.normalizedRole())) {
            return conversationRepository.findAll().stream()
                .sorted(Comparator.comparing(ConversationEntity::getCreatedAt).reversed())
                .map(c -> toConversationDto(c, usersById))
                .toList();
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teacher/student messaging is allowed.");
    }

    public List<MessagingDtos.MessageDto> conversationMessages(Long conversationId) {
        UserSummary current = requireCurrentUser();
        ConversationEntity c = requireConversationAllowed(conversationId, current);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId())
            .stream()
            .map(this::toMessageDto)
            .toList();
    }

    public MessagingDtos.MessageDto sendMessage(Long conversationId, MessagingDtos.SendMessageRequest request) {
        UserSummary current = requireCurrentUser();
        ConversationEntity c = requireConversationAllowed(conversationId, current);
        return saveMessageInConversation(current, c, request);
    }

    public MessagingDtos.MessageDto sendTeacherMessageToStudent(Long studentId, MessagingDtos.SendMessageRequest request) {
        UserSummary current = requireCurrentUser();
        ensureTeacher(current);

        UserSummary student = loadAllUsers().stream()
            .filter(u -> studentId.equals(u.id()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found."));

        if (!"STUDENT".equals(student.normalizedRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only student can be targeted.");
        }

        ConversationEntity c = conversationRepository.findByTeacherIdAndStudentId(current.id(), student.id())
            .orElseGet(() -> createConversation(current.id(), student.id()));
        return saveMessageInConversation(current, c, request);
    }

    public void deleteMessageForAdmin(Long messageId) {
        UserSummary current = requireCurrentUser();
        if (!"ADMIN".equals(current.normalizedRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required.");
        }
        MessageEntity message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        messageRepository.delete(message);
    }

    public List<MessagingDtos.ConversationDto> adminSupervisedConversations() {
        UserSummary current = requireCurrentUser();
        if (!"ADMIN".equals(current.normalizedRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required.");
        }

        Map<Long, UserSummary> usersById = safeLoadAllUsers().stream()
            .collect(Collectors.toMap(UserSummary::id, u -> u, (a, b) -> a));

        Map<String, MessagingDtos.ConversationDto> pairs = new LinkedHashMap<>();

        for (ConversationEntity c : conversationRepository.findAll()) {
            MessagingDtos.ConversationDto dto = toConversationDto(c, usersById);
            pairs.put(pairKey(dto.teacherId(), dto.studentId()), dto);
        }

        for (MessageEntity m : messageRepository.findAllByOrderByCreatedAtDesc()) {
            UserSummary sender = usersById.get(m.getSenderId());
            UserSummary receiver = usersById.get(m.getReceiverId());
            if (sender == null || receiver == null) {
                continue;
            }
            if (!isTeacherStudentPair(sender, receiver)) {
                continue;
            }
            Long teacherId = "TEACHER".equals(sender.normalizedRole()) ? sender.id() : receiver.id();
            Long studentId = "STUDENT".equals(sender.normalizedRole()) ? sender.id() : receiver.id();
            String key = pairKey(teacherId, studentId);
            if (pairs.containsKey(key)) {
                continue;
            }
            LocalDateTime updatedAt = m.getCreatedAt() == null ? m.getTimestamp() : m.getCreatedAt();
            pairs.put(
                key,
                new MessagingDtos.ConversationDto(
                    syntheticConversationId(teacherId, studentId),
                    teacherId,
                    studentId,
                    resolveDisplayName(usersById.get(teacherId), "teacher"),
                    resolveDisplayName(usersById.get(studentId), "student"),
                    m.getContent() == null ? "Aucun message" : m.getContent(),
                    updatedAt
                )
            );
        }

        return pairs.values().stream()
            .sorted(Comparator.comparing(MessagingDtos.ConversationDto::updatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .toList();
    }

    public List<MessagingDtos.MessageDto> adminConversationMessages(Long teacherId, Long studentId) {
        UserSummary current = requireCurrentUser();
        if (!"ADMIN".equals(current.normalizedRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required.");
        }
        if (teacherId == null || studentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teacherId and studentId are required.");
        }

        return messageRepository.findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
                teacherId, studentId, studentId, teacherId
            ).stream()
            .map(this::toMessageDto)
            .toList();
    }

    private MessagingDtos.MessageDto saveMessageInConversation(
        UserSummary current,
        ConversationEntity c,
        MessagingDtos.SendMessageRequest request
    ) {
        String content = request == null || request.content() == null ? "" : request.content().trim();
        if (content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content is required.");
        }

        Long senderId = current.id();
        Long receiverId = senderId.equals(c.getTeacherId()) ? c.getStudentId() : c.getTeacherId();

        if ("TEACHER".equals(current.normalizedRole()) && !senderId.equals(c.getTeacherId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher cannot send in this conversation.");
        }
        if ("STUDENT".equals(current.normalizedRole()) && !senderId.equals(c.getStudentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student cannot send in this conversation.");
        }

        MessageEntity m = new MessageEntity();
        m.setConversationId(c.getId());
        m.setSenderId(senderId);
        m.setReceiverId(receiverId);
        m.setContent(content);
        m.setCreatedAt(LocalDateTime.now());
        m.setRead(Boolean.FALSE);
        MessageEntity saved = messageRepository.save(m);

        log.info(
            "Messaging send success teacherId={} studentId={} teacherUsername={} studentUsername={} conversationId={} senderId={} receiverId={} content={}",
            c.getTeacherId(),
            c.getStudentId(),
            resolveUsernameById(c.getTeacherId()),
            resolveUsernameById(c.getStudentId()),
            c.getId(),
            senderId,
            receiverId,
            shorten(content, 120)
        );

        return toMessageDto(saved);
    }

    public MessagingDtos.ConversationDto createConversationForCurrentUser(MessagingDtos.CreateConversationRequest request) {
        UserSummary current = requireCurrentUser();
        if (request == null || request.participantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "participantId is required.");
        }
        Long participantId = request.participantId();
        List<UserSummary> allUsers = loadAllUsers();
        Map<Long, UserSummary> usersById = allUsers.stream().collect(Collectors.toMap(UserSummary::id, u -> u, (a, b) -> a));
        UserSummary participant = usersById.get(participantId);
        if (participant == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found.");
        }

        ConversationEntity c;
        if ("TEACHER".equals(current.normalizedRole())) {
            if (!"STUDENT".equals(participant.normalizedRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher can only start conversation with students.");
            }
            c = conversationRepository.findByTeacherIdAndStudentId(current.id(), participant.id())
                .orElseGet(() -> createConversation(current.id(), participant.id()));
        } else if ("STUDENT".equals(current.normalizedRole())) {
            UserSummary teacher = resolveMainTeacher();
            if (!participant.id().equals(teacher.id())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student can only talk to main teacher.");
            }
            c = conversationRepository.findByTeacherIdAndStudentId(teacher.id(), current.id())
                .orElseGet(() -> createConversation(teacher.id(), current.id()));
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teacher/student messaging is allowed.");
        }
        return toConversationDto(c, usersById);
    }

    private ConversationEntity requireConversationAllowed(Long conversationId, UserSummary current) {
        ConversationEntity c = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        boolean allowed = current.id().equals(c.getTeacherId())
            || current.id().equals(c.getStudentId())
            || "ADMIN".equals(current.normalizedRole());
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed for this conversation.");
        }
        return c;
    }

    private UserSummary requireCurrentUser() {
        String sub = auth.keycloakSub();
        Optional<UserSummary> current = safeLoadAllUsers().stream()
            .filter(u -> sub.equals(u.keycloakId()))
            .findFirst();

        if (current.isPresent()) {
            return current.get();
        }

        // Admin accounts can exist only in IAM/Keycloak without being synced in users table.
        if (auth.hasRole("ADMIN")) {
            return new UserSummary(
                -1L,
                sub,
                auth.username(),
                null,
                "Admin",
                auth.username(),
                "ADMIN"
            );
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not synced in users service.");
    }

    private UserSummary resolveMainTeacher() {
        List<UserSummary> users = loadAllUsers().stream()
            .filter(u -> "TEACHER".equals(u.normalizedRole()))
            .toList();
        if (users.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No teacher account found.");
        }
        Optional<UserSummary> configured = users.stream()
            .filter(u -> u.username() != null && u.username().equalsIgnoreCase(mainTeacherUsername))
            .findFirst();
        return configured.orElse(users.get(0));
    }

    private void ensureTeacher(UserSummary user) {
        if (!"TEACHER".equals(user.normalizedRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher role required.");
        }
    }

    private void ensureStudent(UserSummary user) {
        if (!"STUDENT".equals(user.normalizedRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student role required.");
        }
    }

    private ConversationEntity createConversation(Long teacherId, Long studentId) {
        ConversationEntity c = new ConversationEntity();
        c.setTeacherId(teacherId);
        c.setStudentId(studentId);
        return conversationRepository.save(c);
    }

    private List<UserSummary> loadAllUsers() {
        return userDirectoryClient.getAllUsers().stream()
            .filter(u -> u.id() != null && u.keycloakId() != null && !u.keycloakId().isBlank())
            .toList();
    }

    private List<UserSummary> safeLoadAllUsers() {
        try {
            return loadAllUsers();
        } catch (Exception ex) {
            log.warn("Unable to load users from directory service: {}", ex.getMessage());
            return List.of();
        }
    }

    private MessagingDtos.ParticipantDto toParticipant(UserSummary user) {
        return new MessagingDtos.ParticipantDto(user.id(), user.username(), user.displayName(), user.normalizedRole());
    }

    private MessagingDtos.ConversationDto toConversationDto(ConversationEntity c, Map<Long, UserSummary> usersById) {
        UserSummary teacher = usersById.get(c.getTeacherId());
        UserSummary student = usersById.get(c.getStudentId());
        String teacherName = teacher == null ? "teacher" : teacher.displayName();
        String studentName = student == null ? "student" : student.displayName();
        List<MessageEntity> msgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
        MessageEntity last = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
        return new MessagingDtos.ConversationDto(
            c.getId(),
            c.getTeacherId(),
            c.getStudentId(),
            teacherName,
            studentName,
            last == null ? "Aucun message" : last.getContent(),
            last == null ? c.getCreatedAt() : (last.getCreatedAt() == null ? last.getTimestamp() : last.getCreatedAt())
        );
    }

    private MessagingDtos.MessageDto toMessageDto(MessageEntity m) {
        LocalDateTime createdAt = m.getCreatedAt() == null ? m.getTimestamp() : m.getCreatedAt();
        return new MessagingDtos.MessageDto(
            m.getId(),
            m.getConversationId(),
            m.getSenderId(),
            m.getReceiverId(),
            m.getContent(),
            createdAt,
            Boolean.TRUE.equals(m.getRead())
        );
    }

    private String resolveUsernameById(Long userId) {
        return loadAllUsers().stream()
            .filter(u -> userId.equals(u.id()))
            .map(UserSummary::username)
            .findFirst()
            .orElse("unknown");
    }

    private String shorten(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }

    private boolean isTeacherStudentPair(UserSummary first, UserSummary second) {
        return ("TEACHER".equals(first.normalizedRole()) && "STUDENT".equals(second.normalizedRole()))
            || ("STUDENT".equals(first.normalizedRole()) && "TEACHER".equals(second.normalizedRole()));
    }

    private String pairKey(Long teacherId, Long studentId) {
        return teacherId + ":" + studentId;
    }

    private Long syntheticConversationId(Long teacherId, Long studentId) {
        return teacherId * 1_000_000L + studentId;
    }

    private String resolveDisplayName(UserSummary user, String fallback) {
        return user == null ? fallback : user.displayName();
    }
}
