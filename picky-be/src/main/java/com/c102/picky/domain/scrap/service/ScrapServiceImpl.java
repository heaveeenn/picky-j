package com.c102.picky.domain.scrap.service;

import com.c102.picky.domain.content.service.ContentQueryService;
import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.scrap.dto.ScrapCreateRequestDto;
import com.c102.picky.domain.scrap.dto.ScrapResponseDto;
import com.c102.picky.domain.scrap.entity.UserScrap;
import com.c102.picky.domain.scrap.repository.UserScrapRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScrapServiceImpl implements ScrapService {

    private final UserScrapRepository scrapRepository;
    private final ContentQueryService contentQueryService;


    @Override
    @Transactional
    public ScrapResponseDto createScrap(Long userId, ScrapCreateRequestDto request) {
        Optional<UserScrap> existingScrap = findExistingScrap(userId, request);

        if (existingScrap.isPresent() && existingScrap.get().isActive()) {
            throw new ApiException(ErrorCode.ALREADY_SCRAPED);
        }

        UserScrap scrap = existingScrap.orElseGet(() -> createNewScrap(userId, request));
        scrap.setActive(true);
        scrap.setNote(request.getNote());
        scrap.setLabels(request.getLabelsJson());

        UserScrap saved = scrapRepository.save(scrap);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteScrap(Long userId, Long scrapId) {
        var scrap = scrapRepository.findById(scrapId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));
        if(!scrap.getUserId().equals(userId)) throw new ApiException(ErrorCode.ACCESS_DENIED);
        scrap.setActive(false);
        scrapRepository.save(scrap);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ScrapResponseDto> getScraps(Long userId, ContentType type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserScrap> p = (type != null)
                ? scrapRepository.findByUserIdAndContentTypeAndIsActiveTrueOrderByUpdatedAtDesc(userId, type, pageable)
                : scrapRepository.findByUserIdAndIsActiveTrueOrderByUpdatedAtDesc(userId, pageable);

        return p.map(this::toResponse);
    }

    @Override
    @Transactional
    public ScrapResponseDto toggleScrap(Long userId, ScrapCreateRequestDto request) {
        Optional<UserScrap> existingScrap = findExistingScrap(userId, request);

        UserScrap scrap = existingScrap.orElseGet(() -> createNewScrap(userId, request));
        scrap.toggle();

        // 토글할 때마다 메모와 라벨 업데이트
        if (scrap.isActive()) {
            scrap.setNote(request.getNote());
            scrap.setLabels(request.getLabelsJson());
        }

        UserScrap saved = scrapRepository.save(scrap);
        return saved.isActive() ? toResponse(saved) : null;
    }

    private Optional<UserScrap> findExistingScrap(Long userId, ScrapCreateRequestDto request) {
        return request.getContentType() == ContentType.NEWS
                ? scrapRepository.findByUserIdAndContentTypeAndNewsId(userId, ContentType.NEWS, request.getContentId())
                : scrapRepository.findByUserIdAndContentTypeAndQuizId(userId, ContentType.QUIZ, request.getContentId());
    }

    private UserScrap createNewScrap(Long userId, ScrapCreateRequestDto request) {
        return UserScrap.builder()
                .userId(userId)
                .contentType(request.getContentType())
                .newsId(request.getContentType() == ContentType.NEWS ? request.getContentId() : null)
                .quizId(request.getContentType() == ContentType.QUIZ ? request.getContentId() : null)
                .note(request.getNote())
                .labels(request.getLabelsJson())
                .isActive(false) // toggle()에서 true로 변경됨
                .build();
    }

    private ScrapResponseDto toResponse(UserScrap s) {
        ScrapResponseDto dto = ScrapResponseDto.builder()
                .scrapId(s.getId())
                .contentType(s.getContentType())
                .contentId(s.getContentId())
                .note(s.getNote())
                .labelsJson(s.getLabels())
                .createdAt(s.getCreatedAt())
                .build();

        switch (s.getContentType()) {

            case NEWS -> {
                var news = contentQueryService.getNewsPayload(s.getNewsId());
                dto.setTitle(news.getTitle());
                dto.setUrl(news.getUrl());
            }
            case QUIZ -> {
                var quiz = contentQueryService.getQuizPayload(s.getQuizId(), false, false);
                dto.setTitle(quiz.getQuestion());
                dto.setUrl(quiz.getUrl());
            }
        }

        return dto;
    }
}