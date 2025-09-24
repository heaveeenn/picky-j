package com.c102.picky.domain.userstats.entity;

import com.c102.picky.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;


@Entity
@Table(
        name = "daily_aggregate_summary"
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DailyAggregateSummary  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "summary_date", nullable = false)
    private LocalDate summaryDate; // 집계 기준일 (예: 2025-09-21)

    private Double avgVisitCount;       // 평균 방문 사이트 수 (소수점 포함)
    private Long avgBrowsingSeconds;  // 평균 브라우징 시간 (분 단위)
    private Integer peakHour;     // 가장 활발한 시간대 (예: "14: 14-15시")
}
