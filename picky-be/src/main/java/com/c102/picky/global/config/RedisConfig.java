package com.c102.picky.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericToStringSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Key는 String으로 직렬화
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value는 String으로 직렬화 (간단한 값들만 저장)
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());
        
        template.setDefaultSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        
        return template;
    }
}