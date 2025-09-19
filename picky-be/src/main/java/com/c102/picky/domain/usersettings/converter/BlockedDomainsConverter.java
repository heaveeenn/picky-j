package com.c102.picky.domain.usersettings.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter
public class BlockedDomainsConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> value) {
        try {
            return MAPPER.writeValueAsString(value == null ? new ArrayList<>() : value);
        } catch (Exception e) {
            throw new IllegalStateException("blocked_domains 직렬화 실패", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String value) {
        try {
            return value == null || value.isBlank()
                    ? new ArrayList<>()
                    : MAPPER.readValue(value, TYPE);
        } catch (Exception e) {
            throw new IllegalStateException("blocked_domains 역직렬화 실패", e);
        }
    }
}
