package com.esprit.messaging.repository;

import com.esprit.messaging.entity.UserBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserBanRepository extends JpaRepository<UserBan, Long> {

    Optional<UserBan> findByUserId(Long userId);

    @Query("SELECT ub FROM UserBan ub WHERE ub.userId = :userId AND ub.bannedUntil > :now")
    Optional<UserBan> findActiveBan(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
