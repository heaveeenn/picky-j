package com.c102.picky.domain.users.repository;

import com.c102.picky.domain.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByGoogleSub(String googleSub);
    Optional<User> findByEmail(String email);
    boolean existsByGoogleSub(String googleSub);
    boolean existsByEmail(String email);
}
