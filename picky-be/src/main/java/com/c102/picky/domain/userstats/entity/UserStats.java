package com.c102.picky.domain.userstats.entity;

import com.c102.picky.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_stats", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user", columnNames = {"user_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK 연결
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    private Long totalSites = 0L;
    @Builder.Default
    private Long totalTimeSpent = 0L;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.lastUpdated = LocalDateTime.now();
    }

    public void addTotalSites(long sites) {
        this.totalSites += sites;
    }
    public void addTotalTime(long time) {
        this.totalTimeSpent += time;
    }
}
