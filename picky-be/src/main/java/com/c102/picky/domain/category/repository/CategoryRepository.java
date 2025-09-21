package com.c102.picky.domain.category.repository;

import com.c102.picky.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameAndLevel(String name, Category.Level level);
    List<Category> findAllByLevel(Category.Level level);

    Optional<Object> findByName(String catName);
}
