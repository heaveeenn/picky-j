package com.c102.picky.domain.userinterest.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class UserCategoryId implements Serializable {
    private Long userId;
    private Long categoryId;
}
