package com.c102.picky.domain.userInterest.repository;

import com.c102.picky.domain.userInterest.entity.UserCategoryId;
import com.c102.picky.domain.userInterest.entity.UserInterestCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserInterestCategoryRepository extends JpaRepository<UserInterestCategory, UserCategoryId> {

    List<UserInterestCategory> findByUserId(Long userId);

    boolean existsAllByUserIdAndIdCategoryId(Long userId, Long categoryId);

    void deleteByIdUserIdAndIdCategoryId(Long userId, Long categoryId);
}
