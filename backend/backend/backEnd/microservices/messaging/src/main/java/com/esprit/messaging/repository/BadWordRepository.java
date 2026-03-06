package com.esprit.messaging.repository;

import com.esprit.messaging.entity.BadWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BadWordRepository extends JpaRepository<BadWord, Long> {
    List<BadWord> findAllByOrderByWordAsc();
}
