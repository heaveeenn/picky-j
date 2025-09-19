package com.c102.picky.domain.recommendation.respository;

import com.c102.picky.domain.recommendation.entity.UserRecommendationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRecommendationEventRepository extends JpaRepository<UserRecommendationEvent, Long> {}
