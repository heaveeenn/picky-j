package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.users.entity.User;
import com.c102.picky.domain.userstats.entity.UserDomainStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserDomainStatsRepository extends JpaRepository<UserDomainStats,Long> {
    Optional<UserDomainStats> findByUserAndDomain(User user, String dom);

    List<UserDomainStats> findByUserIdOrderByTimeSpentDesc(Long userId);
}
