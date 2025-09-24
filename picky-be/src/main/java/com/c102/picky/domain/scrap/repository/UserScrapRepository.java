package com.c102.picky.domain.scrap.repository;

import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.scrap.entity.UserScrap;
import com.c102.picky.domain.users.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserScrapRepository extends JpaRepository<UserScrap, Long> {

    // 사용자별 콘텐츠별 스크랩 조회 (활성/비활성 모두)
    Optional<UserScrap> findByUserIdAndContentTypeAndNewsId(Long userId, ContentType type, Long newsId);
    Optional<UserScrap> findByUserIdAndContentTypeAndQuizId(Long userId, ContentType type, Long quizId);

    // 활성 스크랩만 조회
    Page<UserScrap> findByUserIdAndContentTypeAndIsActiveTrueOrderByUpdatedAtDesc(Long userId, ContentType type, Pageable pageable);
    Page<UserScrap> findByUserIdAndIsActiveTrueOrderByUpdatedAtDesc(Long userId, Pageable pageable);
}
