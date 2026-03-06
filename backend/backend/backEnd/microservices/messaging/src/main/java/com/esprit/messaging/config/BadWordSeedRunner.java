package com.esprit.messaging.config;

import com.esprit.messaging.entity.BadWord;
import com.esprit.messaging.repository.BadWordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class BadWordSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BadWordSeedRunner.class);
    private static final Set<String> DEFAULT_BAD_WORDS = Set.of("qqqqq", "sssss", "ddddd", "fffff");

    private final BadWordRepository badWordRepository;

    public BadWordSeedRunner(BadWordRepository badWordRepository) {
        this.badWordRepository = badWordRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<BadWord> existing = badWordRepository.findAllByOrderByWordAsc();
        Set<String> existingWords = existing.stream().map(BadWord::getWord).collect(Collectors.toSet());
        for (String w : DEFAULT_BAD_WORDS) {
            String lower = w.toLowerCase();
            if (!existingWords.contains(lower)) {
                badWordRepository.save(new BadWord(lower));
                log.info("bad_word: seeded '{}'", lower);
                existingWords.add(lower);
            }
        }
    }
}
