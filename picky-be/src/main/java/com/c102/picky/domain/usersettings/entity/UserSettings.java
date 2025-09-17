package com.c102.picky.domain.usersettings.entity;

import com.c102.picky.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "avatar", nullable = false, length = 30)
    private String avatarCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "blocked_domains", columnDefinition = "json", nullable = false)
    private List<String> blockedDomains;

    @Column(name = "notify_type", nullable = false)
    private int notifyType;

    @Column(name = "notify_interval", nullable = false)
    private Integer notifyIntervalMinutes;

    @Column(name = "notify_enabled", nullable = false)
    private boolean notifyEnabled;

    @Column(name = "updated_at", nullable = false,
    insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    // 정적 팩토리
    public static UserSettings of(User user){
        return UserSettings.builder()
                .user(user)
                .avatarCode("DEFAULT")
                .blockedDomains(List.of())
                .notifyType(7)
                .notifyIntervalMinutes(60)
                .notifyEnabled(true)
                .build();
    }

    public UserSettings changeAvatarCode(String newAvatarCode) {
        return UserSettings.builder()
                .user(user)
                .avatarCode(newAvatarCode)
                .blockedDomains(blockedDomains)
                .notifyType(notifyType)
                .notifyIntervalMinutes(notifyIntervalMinutes)
                .notifyEnabled(notifyEnabled)
                .build();
    }

    // NotifyType 관련 비즈니스 메서드
    public Set<NotifyType> getNotifyTypes() {
        return NotifyType.fromMask(notifyType);
    }

    public void changeNotifyTypes(Set<NotifyType> types) {
        this.notifyType = NotifyType.toMask(types);
    }

    public boolean isNewsEnabled() { return (notifyType & NotifyType.NEWS.bit()) != 0;}
    public boolean isFactEnabled() { return (notifyType & NotifyType.FACT.bit()) != 0;}
    public boolean isQuizEnabled() { return (notifyType & NotifyType.QUIZ.bit()) != 0;}

    public void enable(NotifyType type) { this.notifyType |= type.bit();}
    public void disable(NotifyType type) { this.notifyType &= ~type.bit(); }

    // 나머지 Change 메소드 추가 예정...
}
