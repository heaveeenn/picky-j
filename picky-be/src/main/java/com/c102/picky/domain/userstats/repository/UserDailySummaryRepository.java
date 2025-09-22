package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.userstats.entity.UserDailySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserDailySummaryRepository extends JpaRepository<UserDailySummary, Long> {
}
