package com.esprit.messaging.controller;

import com.esprit.messaging.service.BlockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messaging/block")
public class BlockController {

    @Autowired
    private BlockService blockService;

    /** Bloquer un utilisateur. POST /messaging/block/{blockerId}/{blockedId} */
    @PostMapping("/{blockerId}/{blockedId}")
    public ResponseEntity<Void> block(@PathVariable Long blockerId, @PathVariable Long blockedId) {
        try {
            blockService.block(blockerId, blockedId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** Débloquer. DELETE /messaging/block/{blockerId}/{blockedId} */
    @DeleteMapping("/{blockerId}/{blockedId}")
    public ResponseEntity<Void> unblock(@PathVariable Long blockerId, @PathVariable Long blockedId) {
        blockService.unblock(blockerId, blockedId);
        return ResponseEntity.ok().build();
    }

    /** Liste des IDs bloqués par l'utilisateur. GET /messaging/block/list/{blockerId} */
    @GetMapping("/list/{blockerId}")
    public ResponseEntity<List<Long>> getBlockedIds(@PathVariable Long blockerId) {
        List<Long> ids = blockService.getBlockedUserIds(blockerId);
        return ResponseEntity.ok(ids);
    }
}
