package com.c102.picky.domain.userstats.entity;

import com.c102.picky.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_domain_stats", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_domain", columnNames = {"user_id", "domain"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserDomainStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User FK
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String domain;
    @Builder.Default
    private Long visitCount = 0L;
    @Builder.Default
    private Long timeSpent = 0L;

    public void addVisitCount(long count) {
        this.visitCount += count;
    }
    public void addTimeSpent(long time) {
        this.timeSpent += time;
    }
}
