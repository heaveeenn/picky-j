package com.c102.picky.global.init;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Component
@Order(1)   // (여러 Runner 중) 실행 우선순위. 숫자가 낮을수록 먼저 실행.
@DependsOn("entityManagerFactory")  // JPA가 엔티티로 테이블 생성(ddl-auto)한 뒤 실행되도록 보수적 의존
@RequiredArgsConstructor
public class QuizCsvInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbc;    // 순수 SQL 실행용. 대량 적재는 JPA 대신 JDBC가 적합

    // 기능 on/off 스위치. 운영에서 끄고 켤 수 있도록 env로 제어
    @Value("${app.seed.enabled:true}")
    private boolean enabled;

    // 컨테이너 내 CSV 경로.
    @Value("${app.seed.csv-path:/app/data/quiz_wiki_all.csv}")
    private String csvPath;

    // 줄바꿈 (윈도우: CRLF)
    @Value("${app.seed.line-ending:CRLF}")
    private String lineEnding;

    // 강제 재적재 플래그. true -> TRUNCATE 후 다시 적재
    @Value("${app.seed.force:false}")
    private boolean force;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 0. 기능 꺼져있으면 바로 리턴
        if (!enabled) {
            log.info("[QuizCsvInitializer] disabled. skip.");
            return;
        }

        // 1. CSV 존재 확인 (마운트/경로 문제 조기 감지)
        Path csv = Paths.get(csvPath);
        if (!Files.exists(csv)) {
            log.warn("[QuizCsvInitializer] CSV not found: {}", csv.toAbsolutePath());
            return;
        }

        // 2. 현재 적재 여부 확인: quiz 테이블 행 수로 판단
        Long existing = jdbc.queryForObject("SELECT COUNT(*) FROM quiz", Long.class);

        // 2-1. 강제 재적재가 요청되면 TRUNCATE 후 진행
        if (Boolean.TRUE.equals(force)) {
            log.warn("[QuizCsvInitializer] force=true -> TRUNCATE quiz and reload.");
            jdbc.execute("TRUNCATE TABLE quiz");
            existing = 0L;
        }

        // 2-2. 이미 데이터가 있으면 스킵
        if (existing != null && existing > 0) {
            log.info("[QuizCsvInitializer] quiz already has {} rows -> skip load.", existing);
            return;
        }

        // 3. LOAD DATA 구성
        // - 라인 엔딩: 윈도우(CRLF)
        // - 경로: MySQL은 SQL literal로 경로를 받으므로 작은따옴표(')와 역슬래시(\)를 이스케이프
        String lines = "CRLF".equalsIgnoreCase(lineEnding) ? "\\r\\n" : "\\n";
        String escaped = csvPath
                .replace("\\", "\\\\")   // 역슬래시를 두 번 써서 SQL literal로 안전하게
                .replace("'", "\\'");    // 작은따옴표 이스케이프

        /**
         * 중요: CSV 포맷 옵션
         * - ENCLOSED BY: 필드를 감싸는 문자. 일반 CSV는 큰따옴표(")를 사용 => '"'로 표기
         * - ESCAPED BY: 이스케이프 문자. 일반적으로 역슬래시(\\)를 사용 => '\\'
         *  (이 두 값은 Java 문자열이 아니라 "SQL" 문자열이라, Java text block에서
         *   그대로 '"'와 '\\'로 써주는 게 가장 안전/명확)
         *
         * - (question, @ans, explanation, title, url, rule):
         *    CSV 컬럼 순서에 정확히 맞춰야 함.
         *    answer는 CSV에 'O'/'X'로 들어오므로 @ans로 임시 변수에 받고
         *    SET 절에서 TINYINT(1) boolean으로 변환 (UPPER(@ans)='O' -> 1, else 0).
         */
        String loadSql = """
                    LOAD DATA LOCAL INFILE '%s'
                    INTO TABLE quiz
                    CHARACTER SET utf8mb4
                    FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\\\'
                    LINES TERMINATED BY '%s'
                    IGNORE 1 LINES
                    (question, @ans, explanation, title, url, rule)
                    SET answer = IF(UPPER(@ans)='O', 1, 0);
                """.formatted(escaped, lines);

        // 4. 대량 적재 실행
        // - 서버: --local-infile=1
        // - JDBC URL: allowLoadLocalInfile=true
        // - CSV: 컨테이너에서 접근 가능한 경로(/app/data/...)
        jdbc.execute(loadSql);

        // 5. 결과 로깅
        Long after = jdbc.queryForObject("SELECT COUNT(*) FROM quiz", Long.class);
        log.info("[QuizCsvInitializer] load complete. rows={}", after);
    }
}
