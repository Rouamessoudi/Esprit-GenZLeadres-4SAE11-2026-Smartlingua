package com.esprit.users.repositories;

import com.esprit.users.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByKeycloakId(String keycloakId);
    boolean existsByKeycloakId(String keycloakId);
    long countByRoleIgnoreCaseAndDeletedFalse(String role);
    long countByDeletedFalse();
    Optional<User> findByIdAndDeletedFalse(Long id);
    Optional<User> findByKeycloakIdAndDeletedFalse(String keycloakId);

    @Query("""
        select u from User u
        where u.deleted = false
          and (:role is null or upper(u.role) = upper(:role))
          and (:q is null or lower(u.username) like lower(concat('%', :q, '%')) or lower(coalesce(u.email, '')) like lower(concat('%', :q, '%')))
        order by u.createdAt desc
    """)
    List<User> searchAdminUsers(@Param("role") String role, @Param("q") String q);
}
