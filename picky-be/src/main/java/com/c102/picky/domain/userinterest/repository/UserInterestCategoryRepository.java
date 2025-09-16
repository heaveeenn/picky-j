package com.c102.picky.domain.userinterest.repository;

import com.c102.picky.domain.userinterest.entity.UserCategoryId;
import com.c102.picky.domain.userinterest.entity.UserInterestCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserInterestCategoryRepository extends JpaRepository<UserInterestCategory, UserCategoryId> {

    List<UserInterestCategory> findByIdUserId(Long userId);

    boolean existsByIdUserIdAndIdCategoryId(Long userId, Long categoryId);

    void deleteByIdUserIdAndIdCategoryId(Long userId, Long categoryId);
}
