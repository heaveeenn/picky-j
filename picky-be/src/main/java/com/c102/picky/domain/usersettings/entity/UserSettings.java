package com.c102.picky.domain.usersettings.entity;

import com.c102.picky.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
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

    @Column(name = "avatar_code", nullable = false, length = 30)
    private String avatarCode;

    @Convert(converter = com.c102.picky.domain.usersettings.converter.BlockedDomainsConverter.class)
    @Column(name = "blocked_domains", columnDefinition = "json", nullable = false)
    private List<String> blockedDomains;

    @Column(name = "notify_type", nullable = false)
    private int notifyType;

    @Column(name = "notify_interval", nullable = false)
    private Integer notifyInterval;

    @Column(name = "notify_enabled", nullable = false)
    private boolean notifyEnabled;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 정적 팩토리
    public static UserSettings of(User user){
        return UserSettings.builder()
                .user(user)
                .avatarCode("DEFAULT")
                .blockedDomains(List.of())
                .notifyType(7)
                .notifyInterval(60)
                .notifyEnabled(true)
                .build();
    }

    // 유효성 & 정규화
    private static int normalizeMask(int mask) {
        if (mask < 0) mask = 0;
        return mask & 0b111;
    }

    private static int normalizeInterval(int m) {
        if (m < 0) m = 10;
        if (m > 180) m = 180;
        if (m % 10 != 0) m = (m/10)*10; // 내림 정규화
        return m;
    }

    private static String normalizeDomain(String d) {
        if (d == null) return "";
        d = d.trim().toLowerCase(Locale.ROOT);
        // 앞뒤 점/슬래시 정리
        while (d.startsWith(".")) d = d.substring(1);
        if (d.startsWith("http://")) d = d.substring(7);
        if (d.startsWith("https://")) d = d.substring(8);
        if (d.endsWith("/")) d =  d.substring(0, d.length() - 1);
        return d;
    }

    private static List<String> normalizeDomains(List<String> list) {
        if (list == null) return new ArrayList<>();
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String s : list) {
            String n = normalizeDomain(s);
            if (!n.isBlank()) set.add(n);
        }
        return new ArrayList<>(set);
    }

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
        if (avatarCode == null || avatarCode.isBlank()) {
            avatarCode = "DEFAULT";
        }
        if (blockedDomains == null) {
            blockedDomains = new ArrayList<>();
        }
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void changeAvatarCode(String avatarCode) {
        this.avatarCode = (avatarCode == null || avatarCode.isBlank()) ? "DEFAULT" : avatarCode;
    }

    // NotifyType 관련 비즈니스 메서드
    public Set<NotifyType> getNotifyTypes() {
        return NotifyType.fromMask(notifyType);
    }

    public void changeNotifyTypes(Set<NotifyType> types) {
        this.notifyType = NotifyType.toMask(types == null ? EnumSet.noneOf(NotifyType.class) : types);
    }

    public void enable(NotifyType type) { this.notifyType |= type.bit();}

    public void disable(NotifyType type) { this.notifyType &= ~type.bit(); }

    public void changeNotifyIntervalMinutes(int minutes) { this.notifyInterval = normalizeInterval(minutes);}

    public void turnOn() { this.notifyEnabled = true; }

    public void turnOff() { this.notifyEnabled = false; }

    public List<String> viewBlockedDomains() {
        return Collections.unmodifiableList(blockedDomains);
    }

    public void setBlockedDomains(List<String> blockedDomains) {
        this.blockedDomains = normalizeDomains(blockedDomains);
    }

    public void removeBlockedDomain(String domain) {
        String d = normalizeDomain(domain);
        this.blockedDomains.removeIf(x -> x.equalsIgnoreCase(d));
    }
}

