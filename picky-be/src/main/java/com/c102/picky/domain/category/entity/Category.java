package com.c102.picky.domain.category.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
@Entity
@Table(name = "categories",
        uniqueConstraints = @UniqueConstraint(name = "uq_categoires_name_level", columnNames = {"name", "level"})
)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_categories_parent"))
    private Category parent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 2)
    private Level level;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "json")
    private String aliases;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==== 정적 팩토리 ====
    public static Category of(String name, Level level, String aliases, Category parent) {
        return Category.builder()
                .name(name)
                .level(level)
                .aliases(aliases)
                .parent(parent)
                .build();
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    // 엔티티 내에서 필요한 변경은 명시적인 메서드로 제공
    public Category changeName(String newName) {
        return Category.builder()
                .id(this.id)
                .parent(this.parent)
                .level(this.level)
                .name(newName)
                .aliases(this.aliases)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }

    public Category changeAliases(String newAliases) {
        return Category.builder()
                .id(this.id)
                .parent(this.parent)
                .level(this.level)
                .name(this.name)
                .aliases(newAliases)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }

    public enum Level { L1, L2 }
}
