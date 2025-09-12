package com.c102.picky.global.security.jwt;

import com.c102.picky.global.exception.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;
    private final AuthenticationEntryPoint entryPoint;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String token = jwt.resolve(request).orElse(null);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            var claims = jwt.parseClaims(token);
            String sub = claims.getSubject();
            String role = (String) claims.get("role");

            request.setAttribute("sub", sub);

            if(role!= null){
                var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(sub, null,
                        List.of(new SimpleGrantedAuthority("ROLE_"+role)));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            SecurityContextHolder.clearContext();
            request.setAttribute("errorCode", ErrorCode.TOKEN_EXPIRED);
            entryPoint.commence(request, response, new BadCredentialsException("expired", e));
        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
            request.setAttribute("errorCode", ErrorCode.INVALID_TOKEN);
            entryPoint.commence(request, response, new BadCredentialsException("invalid", e));
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/auth/")
                || uri.startsWith("/oauth2/")
                || uri.startsWith("/public/")
                || uri.startsWith("/actuator")
                || uri.startsWith("/docs")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }
}
