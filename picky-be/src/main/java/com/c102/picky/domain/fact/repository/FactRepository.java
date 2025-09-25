package com.c102.picky.domain.fact.repository;

import com.c102.picky.domain.fact.entity.Fact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.Random;

public interface FactRepository extends JpaRepository<Fact, Long> {

    // 해당 유저가 아직 보지 않은 Fact 개수
    @Query("""
                select count(f) from Fact f
                where not exists (
                    select 1 from FactView v
                    where v.userId = :userId and v.factId = f.id
                )
            """)
    long countUnseenByUser(@Param("userId") Long userId);

    // 안 본 Fact 목록을 페이지네이션으로 조회
    @Query("""
                select f from Fact f
                where not exists (
                    select 1 from FactView v
                    where v.userId = :userId and v.factId = f.id
                )
            """)
    Page<Fact> findUnseenByUser(@Param("userId") Long userId, Pageable pageable);

    // 전체 Fact 개수
    // 모두 이미 봐서 unseen = 0인 경우 fallback 랜덤을 뽑기 위해 사용
    @Query("select count(f) from Fact f")
    long countAllFacts();

    // 안 본 FAct 개수를 먼저 구하고, 0...cnt-1 중 임의 오프셋(page) 하나를 택해 그 위치의 1건을 가져옴
    default Optional<Fact> pickRandomUnseen(Long userId, Random rnd) {
        long cnt = countUnseenByUser(userId);
        if (cnt <= 0) return Optional.empty();
        int page = (int) rnd.nextLong(cnt);
        return findUnseenByUser(userId, PageRequest.of(page, 1)).stream().findFirst();
    }

    // 전체 Fact에서 동일한 방식으로 임의 1개 뽑기
    // 안 본 게 하나도 없을 때의 fallback
    default Optional<Fact> pickAny(Random rnd) {
        long total = countAllFacts();
        if (total == 0) return Optional.empty();
        int page = (int) rnd.nextLong(total);
        return findAll(PageRequest.of(page, 1)).stream().findFirst();
    }
}
