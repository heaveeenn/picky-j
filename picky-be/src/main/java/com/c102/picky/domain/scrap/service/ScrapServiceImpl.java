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

@Service
@RequiredArgsConstructor
public class ScrapServiceImpl implements ScrapService {

    private final UserScrapRepository scrapRepository;
    private final ContentQueryService contentQueryService;


    @Override
    @Transactional
    public ScrapResponseDto createScrap(Long userId, ScrapCreateRequestDto request) {
        if(request.getContentType() == ContentType.NEWS) {
            scrapRepository.findByUserIdAndContentTypeAndNewsId(userId, ContentType.NEWS, request.getContentId())
                    .ifPresent(scrap -> {throw new ApiException(ErrorCode.ALREADY_SCRAPED);});
        } else {
            scrapRepository.findByUserIdAndContentTypeAndQuizId(userId, ContentType.QUIZ, request.getContentId())
                    .ifPresent(scrap -> {throw new ApiException(ErrorCode.ALREADY_SCRAPED);});
        }
        UserScrap saved = scrapRepository.save(UserScrap.builder()
                .userId(userId)
                .contentType(request.getContentType())
                .newsId(request.getContentType()==ContentType.NEWS ? request.getContentId() : null)
                .quizId(request.getContentType()==ContentType.QUIZ ? request.getContentId() : null)
                .note(request.getNote())
                .labels(request.getLabelsJson())
                .build()
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteScrap(Long userId, Long scrapId) {
        var scrap = scrapRepository.findById(scrapId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));
        if(!scrap.getUserId().equals(userId)) throw new ApiException(ErrorCode.ACCESS_DENIED);
        scrap.markDeleted();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ScrapResponseDto> getScraps(Long userId, ContentType type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserScrap> p = (type != null)
                ? scrapRepository.findByUserIdAndContentTypeAndDeletedAtIsNullOrderByCreatedAtDesc(userId, type, pageable)
                : scrapRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable);

        return p.map(this::toResponse);
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
                dto.setTitle(quiz.getTitle());
                dto.setUrl(quiz.getUrl());
            }
        }

        return dto;
    }
}