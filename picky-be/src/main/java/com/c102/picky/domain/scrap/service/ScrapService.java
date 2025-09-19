package com.c102.picky.domain.scrap.service;

import com.c102.picky.domain.recommendation.model.ContentType;
import com.c102.picky.domain.scrap.dto.ScrapCreateRequestDto;
import com.c102.picky.domain.scrap.dto.ScrapResponseDto;
import org.springframework.data.domain.Page;

public interface ScrapService {
  ScrapResponseDto createScrap(Long userId, ScrapCreateRequestDto request);

  void deleteScrap(Long userId, Long scrapId);

  Page<ScrapResponseDto> getScraps(Long userId, ContentType type, int page, int size);
}
