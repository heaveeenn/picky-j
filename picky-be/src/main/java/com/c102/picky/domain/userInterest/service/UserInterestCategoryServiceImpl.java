package com.c102.picky.domain.userInterest.service;

import com.c102.picky.domain.category.entity.Category;
import com.c102.picky.domain.category.repository.CategoryRepository;
import com.c102.picky.domain.userInterest.dto.UserInterestAddRequestDto;
import com.c102.picky.domain.userInterest.dto.UserInterestResponseDto;
import com.c102.picky.domain.userInterest.entity.UserInterestCategory;
import com.c102.picky.domain.userInterest.repository.UserInterestCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserInterestCategoryServiceImpl implements UserInterestCategoryService {

    private final UserInterestCategoryRepository uiRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<UserInterestResponseDto> addUserInterests(Long userId, UserInterestAddRequestDto request) {
        for (Long categoryId : request.getCategoryIds()) {
            final Long cid = categoryId;

            Category category = categoryRepository.findById(cid)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리: " + cid));

            if (category.getLevel() != Category.Level.L1) {
                throw new IllegalArgumentException("L1 카테고리만 등록할 수 있습니다. id=" + cid);
            }

            if(!uiRepository.existsAllByUserIdAndIdCategoryId(userId, cid)) {
                uiRepository.save(UserInterestCategory.of(userId, category));
            }
        }
        return findUserInterests(userId);
    }

    @Override
    public void removeUserInterest(Long userId, Long categoryId) {
        uiRepository.deleteByIdUserIdAndIdCategoryId(userId, categoryId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserInterestResponseDto> findUserInterests(Long userId) {
        return uiRepository.findByUserId(userId).stream()
                .map(uic -> UserInterestResponseDto.from(
                        uic.getCategory().getId(),
                        uic.getCategory().getName(),
                        uic.getCategory().getLevel().name()
                ))
                .toList();
    }
}
