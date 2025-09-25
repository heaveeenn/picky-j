package com.c102.picky.domain.fact.repository;

import com.c102.picky.domain.fact.entity.FactView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FactViewRepository extends JpaRepository<FactView, Long> {

    boolean existsByUserIdAndFactId(Long userId, Long factId);

}
