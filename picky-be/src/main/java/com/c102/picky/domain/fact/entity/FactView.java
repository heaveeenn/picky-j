package com.c102.picky.domain.fact.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "fact_views",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_fact", columnNames = {"user_id", "fact_id"}
        ),
        indexes = {
                @Index(name = "idx_user_view_time", columnList = "user_id, view_at"),
                @Index(name = "idx_fact", columnList = "fact_id")
        }
)
public class FactView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "fact_id", nullable = false)
    private Long factId;

    @Column(name = "view_at", nullable = false)
    private LocalDateTime viewAt;
}
