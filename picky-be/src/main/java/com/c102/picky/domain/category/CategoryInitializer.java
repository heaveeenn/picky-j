package com.c102.picky.domain.category;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Conditional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed.categories", name= "enabled", havingValue = "true")
public class CategoryInitializer implements ApplicationRunner {

    // L1 카테고리 17개
    private static final List<String> L1_NAMES = List.of(
            "정치", "사회", "경제", "기술", "과학", "건강", "교육", "문화", "엔터테인먼트",
            "스포츠", "역사", "환경", "여행", "생활", "가정", "종교", "철학"
    );

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("[CategoryInitializer] Seeding L1 categories ...");

        // 이미 존재하는 L1 이름 세트
        Set<String> existingNames = new HashSet<>(
                categoryRepository.findAllByLevel(Category.Level.L1).stream()
                        .map(Category::getName)
                        .collect(Collectors.toSet())
        );

        // 없는 것만 저장 (aliases=null -> DB DEFAULT JSON_ARRAY() 적용)
        List<Category> toInsert = L1_NAMES.stream()
                .filter(name -> !existingNames.contains(name))
                .map(name -> Category.of(
                        name,
                        Category.Level.L1,
                        null,
                        null
                ))
                .toList();

        if(!toInsert.isEmpty()) {
            categoryRepository.saveAll(toInsert);
            log.info("[CategoryInitializer] Inserted {} categories", toInsert.size());
        } else {
            log.info("[CategoryInitializer] All L1 categories already present. Skipping.");
        }

    }
}
