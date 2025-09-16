package com.c102.picky.domain.quiz.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quiz", indexes = {
        @Index(name = "idx_quiz_title", columnList = "title")
})
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TINYINT(1)")
    private boolean answer;  // O -> true(1), X -> false(0)

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String explanation;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String url;

    @Column(length = 100)
    private String rule;
}