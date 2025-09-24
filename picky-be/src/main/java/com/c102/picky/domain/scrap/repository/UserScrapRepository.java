package com.c102.picky.domain.scrap.repository;

import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.scrap.entity.UserScrap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;

public interface UserScrapRepository extends JpaRepository<UserScrap, Long> {

    // 사용자별 콘텐츠별 스크랩 조회 (활성/비활성 모두)
    Optional<UserScrap> findByUserIdAndContentTypeAndNewsId(Long userId, ContentType type, Long newsId);

    Optional<UserScrap> findByUserIdAndContentTypeAndQuizId(Long userId, ContentType type, Long quizId);

    // 활성 스크랩만 조회
    Page<UserScrap> findByUserIdAndContentTypeAndIsActiveTrueOrderByUpdatedAtDesc(Long userId, ContentType type, Pageable pageable);

    Page<UserScrap> findByUserIdAndIsActiveTrueOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    @Query("""
                select s.quizId from UserScrap s
                where s.userId = :userId
                  and s.contentType = :ct
                  and s.isActive = true
                  and s.quizId in :quizIds
            """)
    Set<Long> findActiveScrappedQuizIds(@Param("userId") Long userId,
                                        @Param("ct") ContentType ct,
                                        @Param("quizIds") Collection<Long> quizIds);
}
