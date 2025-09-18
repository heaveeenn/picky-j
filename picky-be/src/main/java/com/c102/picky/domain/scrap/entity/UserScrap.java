package com.c102.picky.domain.scrap.entity;

import com.c102.picky.domain.recommendation.model.ContentType;
import jakarta.persistence.*;
import lombok.*;
import org.checkerframework.checker.units.qual.C;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_scraps",
        uniqueConstraints = @UniqueConstraint(name = "uq_user_content", columnNames = {"user_id", "content_type", "news_id", "quiz_id"}),
        indexes = {
            @Index(name = "idx_user_created", columnList = "user_id, created_at"),
                @Index(name="idx_news", columnList = "news_id"),
                @Index(name="idx_quiz", columnList = "quiz_id")
        }
)
public class UserScrap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    @Column(name = "news_id")
    private Long newsId;

    @Column(name = "quiz_id")
    private Long quizId;

    @Column(name = "note", length=200)
    private String note;

    @Lob
    @Column(name = "labels")
    private String labels; // JSON 문자열 (["interview", "AI"])

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public Long getContentId() {
        return contentType == ContentType.NEWS ? newsId : quizId;
    }

    public void markDeleted() {
        this.deletedAt = LocalDateTime.now();
    }
}
