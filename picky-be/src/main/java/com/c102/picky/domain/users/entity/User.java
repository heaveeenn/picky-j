package com.c102.picky.domain.users.entity;

import com.c102.picky.domain.users.dto.Role;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users",
    indexes = {
        @Index(name = "idx_users_google_sub", columnList = "googleSub", unique = true),
        @Index(name = "idx_users_email", columnList = "email")
    }
)
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "google_sub", nullable = false, unique = true, length = 64)
    private String googleSub;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 50)
    private String nickname;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 생성자 팩토리
     private User(String googleSub, String email, String nickname, String profileImage, Role role) {
         this.googleSub = googleSub;
         this.email = email;
         this.nickname = nickname;
         this.profileImage = profileImage;
         this.role = role == null ? Role.USER : role;
     }

     public static User of(String googleSub, String email, String nickname, String profileImage, Role role) {
         return new User(googleSub, email, nickname, profileImage, role);
     }

     // 의도 메시지 (Setter 금지)
    public void changeNickname(String nickname) { this.nickname = nickname; }
    public void updateProfileImage(String profileImage) { this.profileImage = profileImage; }

    @PrePersist
    void onCreate() {
         this.createdAt = LocalDateTime.now();
         this.updatedAt = this.createdAt;
         if(this.role == null) this.role = Role.USER;
    }

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
