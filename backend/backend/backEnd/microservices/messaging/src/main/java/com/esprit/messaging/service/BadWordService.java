package com.esprit.messaging.service;

import com.esprit.messaging.entity.BadWord;
import com.esprit.messaging.entity.UserBan;
import com.esprit.messaging.repository.BadWordRepository;
import com.esprit.messaging.repository.UserBanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class BadWordService {

    private static final int BAN_MINUTES = 10;

    @Autowired
    private BadWordRepository badWordRepository;

    @Autowired
    private UserBanRepository userBanRepository;

    /**
     * Vérifie si l'utilisateur est actuellement banni.
     */
    public boolean isBanned(Long userId) {
        return userBanRepository.findActiveBan(userId, LocalDateTime.now()).isPresent();
    }

    /**
     * Retourne la date/heure de fin de bannissement si l'utilisateur est banni, sinon null.
     */
    public LocalDateTime getBannedUntil(Long userId) {
        return userBanRepository.findActiveBan(userId, LocalDateTime.now())
            .map(UserBan::getBannedUntil)
            .orElse(null);
    }

    /**
     * Filtre le contenu : remplace les mots interdits par des étoiles (*).
     * Retourne le contenu filtré et true si au moins un mot interdit a été trouvé.
     */
    @Transactional(readOnly = true)
    public FilterResult filterContent(String content) {
        if (content == null || content.isEmpty()) {
            return new FilterResult(content, false);
        }
        List<BadWord> badWords = badWordRepository.findAllByOrderByWordAsc();
        if (badWords.isEmpty()) {
            return new FilterResult(content, false);
        }
        String lower = content.toLowerCase(Locale.ROOT);
        String result = content;
        boolean found = false;
        for (BadWord bw : badWords) {
            String word = bw.getWord();
            if (word == null || word.isEmpty()) continue;
            // Remplacement insensible à la casse, avec le même nombre d'étoiles que le mot
            String replacement = "*".repeat(word.length());
            if (lower.contains(word)) {
                found = true;
                result = Pattern.compile(Pattern.quote(word), Pattern.CASE_INSENSITIVE)
                    .matcher(result)
                    .replaceAll(replacement);
            }
        }
        return new FilterResult(result, found);
    }

    /**
     * Bannit l'utilisateur jusqu'à now + 10 minutes.
     * Si déjà banni, prolonge si la nouvelle fin est plus tard.
     */
    @Transactional
    public void banUser(Long userId) {
        LocalDateTime until = LocalDateTime.now().plusMinutes(BAN_MINUTES);
        UserBan ban = userBanRepository.findByUserId(userId).orElse(null);
        if (ban != null) {
            if (ban.getBannedUntil().isBefore(until)) {
                ban.setBannedUntil(until);
                userBanRepository.save(ban);
            }
        } else {
            userBanRepository.save(new UserBan(userId, until));
        }
    }

    public static final class FilterResult {
        private final String content;
        private final boolean hadBadWord;

        public FilterResult(String content, boolean hadBadWord) {
            this.content = content;
            this.hadBadWord = hadBadWord;
        }

        public String getContent() { return content; }
        public boolean hadBadWord() { return hadBadWord; }
    }
}
