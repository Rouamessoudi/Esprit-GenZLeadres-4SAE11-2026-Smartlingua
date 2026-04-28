package com.esprit.messaging;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<MessageEntity> createMessage(@RequestBody MessageRequest request) {
        MessageEntity saved = messageService.createMessage(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<MessageEntity>> conversation(
        @RequestParam Long userId,
        @RequestParam Long peerId
    ) {
        return ResponseEntity.ok(messageService.conversationMessages(userId, peerId));
    }
}
