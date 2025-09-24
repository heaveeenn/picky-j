package com.c102.picky.domain.dashboard.news.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "news_views",
    indexes = {
        @Index(name = "idx_news_views_user_time", columnList = "user_id, viewed_at"),
        @Index(name = "idx_news_views_news_time", columnList = "news_id, viewed_at")
    }
)
public class NewsView {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "news_id", nullable = false)
    private Long newsId;

    @Column(name = "viewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime viewedAt =  LocalDateTime.now();

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        if(viewedAt == null) this.viewedAt = LocalDateTime.now();
        if(createdAt == null) this.createdAt = LocalDateTime.now();
    }

}
