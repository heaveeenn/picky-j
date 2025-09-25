package com.c102.picky.global.config;

import com.c102.picky.global.security.jwt.JwtAuthenticationEntryPoint;
import com.c102.picky.global.security.jwt.JwtAuthenticationFilter;
import com.c102.picky.global.security.oauth2.OAuth2LoginFailureHandler;
import com.c102.picky.global.security.oauth2.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.web.cors.CorsConfigurationSource;
import jakarta.servlet.http.HttpServletRequest;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final OAuth2LoginSuccessHandler oauth2SuccessHandler;
    private final OAuth2LoginFailureHandler oauth2FailureHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationEntryPoint entryPoint, AccessDeniedHandler accessDeniedHandler) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html", "/js/**", "/css/**", "/img/**")
                        .permitAll()
                        .requestMatchers(
                                "/auth/**", "/oauth2/**", "/login/oauth2/**", "/extension/oauth2/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/recommendations/slots").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestResolver(
                                        authorizationRequestResolver()
                                )
                        )
                        .successHandler(oauth2SuccessHandler)
                        .failureHandler(oauth2FailureHandler)
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver() {
        // 통합 resolver - 여러 경로를 모두 처리
        return new OAuth2AuthorizationRequestResolver() {
            private final DefaultOAuth2AuthorizationRequestResolver webResolver =
                new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");

            private final DefaultOAuth2AuthorizationRequestResolver extensionResolver =
                new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/extension/oauth2/authorization");

            {
                // 웹 대시보드: 강제 계정 선택 유지 (기존 동작 유지)
                webResolver.setAuthorizationRequestCustomizer(customizer -> {
                    customizer.additionalParameters(params -> params.put("prompt", "select_account"));
                });

                // 확장프로그램: 강제 계정 선택 제거 (Chrome Identity API와의 충돌 방지)
                // extensionResolver는 prompt 파라미터 없이 사용
            }

            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                String requestURI = request.getRequestURI();

                if (requestURI.startsWith("/extension/oauth2/authorization")) {
                    return extensionResolver.resolve(request);
                } else if (requestURI.startsWith("/oauth2/authorization")) {
                    return webResolver.resolve(request);
                }

                return null;
            }

            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
                String requestURI = request.getRequestURI();

                if (requestURI.startsWith("/extension/oauth2/authorization")) {
                    return extensionResolver.resolve(request, clientRegistrationId);
                } else if (requestURI.startsWith("/oauth2/authorization")) {
                    return webResolver.resolve(request, clientRegistrationId);
                }

                return null;
            }
        };
    }
}
