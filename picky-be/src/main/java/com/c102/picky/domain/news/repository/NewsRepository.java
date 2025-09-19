package com.c102.picky.domain.news.repository;

import com.c102.picky.domain.news.entity.News;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NewsRepository extends JpaRepository<News, Long> {

    // 카테고리까지 한번에 로딩(N+1 방지)
    @EntityGraph(attributePaths = "category")
    Optional<News> findWithCategoryById(Long id);
}
