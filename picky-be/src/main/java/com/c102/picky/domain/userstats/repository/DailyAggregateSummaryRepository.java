package com.c102.picky.domain.userstats.repository;

import com.c102.picky.domain.userstats.entity.DailyAggregateSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyAggregateSummaryRepository extends JpaRepository<DailyAggregateSummary,Long> {
    Optional<DailyAggregateSummary> findBySummaryDate(LocalDate yesterday);
}
