package com.c102.picky.global.security.jwt;

import com.c102.picky.domain.users.dto.Role;
import com.c102.picky.domain.users.entity.Member;
import com.c102.picky.domain.users.repository.MemberRepository;
import com.c102.picky.global.exception.ApiException;
import com.c102.picky.global.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.security.sasl.AuthenticationException;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        Optional<String> tokenOpt = jwt.resolve(request);
        if(tokenOpt.isPresent()) {
            String token = tokenOpt.get();

            if(jwt.validateToken(token)) {
                Claims claims = jwt.parseClaims(token);
                String sub = claims.getSubject();
                String role = (String) claims.get("role");

                request.setAttribute("sub", sub);

                if(role!=null) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            sub, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
                filterChain.doFilter(request, response);
            } else {

            }
        }


    }
}
