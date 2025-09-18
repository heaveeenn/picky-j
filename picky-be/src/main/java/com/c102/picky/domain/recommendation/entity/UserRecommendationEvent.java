package com.c102.picky.domain.recommendation.entity;

import com.c102.picky.domain.recommendation.model.RecommendationEventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_recommendation_events",
        indexes = {
                @Index(name = "idx_ure_user_time", columnList = "user_id, event_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRecommendationEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "slot_id", nullable = false)
    private Long slotId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 12)
    private RecommendationEventType eventType;

    @Column(name = "event_at", nullable = false)
    @Builder.Default
    private LocalDateTime eventAt = LocalDateTime.now();

    @Column(name = "dwell_ms", nullable = false)
    @Builder.Default
    private int dwellMs = 0;

    @Lob
    @Column(name = "meta")
    private String meta;

}
