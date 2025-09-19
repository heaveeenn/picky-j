package com.c102.picky.domain.scrap.dto;

import com.c102.picky.domain.recommendation.model.ContentType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrapCreateRequestDto {
    private ContentType contentType;
    private Long contentId;
    private String note;
    private String labelsJson;

}