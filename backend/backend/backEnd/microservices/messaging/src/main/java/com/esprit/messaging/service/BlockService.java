package com.esprit.messaging.service;

import com.esprit.messaging.entity.UserBlock;
import com.esprit.messaging.repository.UserBlockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BlockService {

    @Autowired
    private UserBlockRepository blockRepository;

    /**
     * Vérifie si receiver a bloqué sender (donc sender ne peut pas envoyer de message à receiver).
     */
    public boolean isBlocked(Long receiverId, Long senderId) {
        return blockRepository.existsByBlockerIdAndBlockedId(receiverId, senderId);
    }

    @Transactional
    public void block(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous bloquer vous-même.");
        }
        if (blockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            return; // déjà bloqué
        }
        blockRepository.save(new UserBlock(blockerId, blockedId));
    }

    @Transactional
    public void unblock(Long blockerId, Long blockedId) {
        blockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    public List<Long> getBlockedUserIds(Long blockerId) {
        return blockRepository.findByBlockerId(blockerId)
            .stream()
            .map(UserBlock::getBlockedId)
            .collect(Collectors.toList());
    }
}
