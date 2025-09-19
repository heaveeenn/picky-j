package com.c102.picky.domain.scrap.repository;

import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.scrap.entity.UserScrap;
import com.c102.picky.domain.users.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserScrapRepository extends JpaRepository<UserScrap, Long> {

    Optional<UserScrap> findByUserIdAndContentTypeAndNewsId(Long userId, ContentType type, Long newsId);
    Optional<UserScrap> findByUserIdAndContentTypeAndQuizId(Long userId, ContentType type, Long quizId);

    Page<UserScrap> findByUserIdAndContentTypeAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, ContentType type, Pageable pageable);
    Page<UserScrap> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
