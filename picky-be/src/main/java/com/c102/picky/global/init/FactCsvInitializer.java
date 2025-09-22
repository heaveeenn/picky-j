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
@Order(2) // Quiz가 1 -> Fact가 2
@DependsOn("entityManagerFactory") // JPA DDL 생성 이후 실행
@RequiredArgsConstructor
public class FactCsvInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Value("${app.fact-seed.enabled:true}")
    private boolean enabled;

    @Value("${app.fact-seed.csv-path:/app/data/factanimal_ko_facts.csv}")
    private String csvPath;

    @Value("${app.fact-seed.line-ending:CRLF}")
    private String lineEnding;

    @Value("${app.fact-seed.force:false}") // true면 TRUNCATE 후 재적재
    private boolean force;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enabled) {
            log.info("[FactCsvInitializer] disabled. skip.");
            return;
        }

        Path csv = Paths.get(csvPath);
        if (!Files.exists(csv)) {
            log.warn("[FactCsvInitializer] CSV not found: {}", csv.toAbsolutePath());
            return;
        }

        Long existing = jdbc.queryForObject("SELECT COUNT(*) FROM fact", Long.class);
        if (Boolean.TRUE.equals(force)) {
            log.warn("[FactCsvInitializer] force=true → TRUNCATE fact and reload.");
            jdbc.execute("TRUNCATE TABLE fact");
            existing = 0L;
        }
        if (existing != null && existing > 0) {
            log.info("[FactCsvInitializer] fact already has {} rows → skip load.", existing);
            return;
        }

        // 줄바꿈/경로 이스케이프
        String lines = "CRLF".equalsIgnoreCase(lineEnding) ? "\\r\\n" : "\\n";
        String escaped = csvPath.replace("\\", "\\\\").replace("'", "\\'");

        /*
         * CSV 헤더: source_url,title_ko,content
         * - IGNORE: content_hash(unique) 충돌 시 조용히 스킵
         * - content_hash는 DB에서 TRIM 후 SHA2(…,256) 계산(소문자 16진)
         */
        String loadSql = """
                LOAD DATA LOCAL INFILE '%s' IGNORE
                INTO TABLE fact
                CHARACTER SET utf8mb4
                FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\\\'
                LINES TERMINATED BY '%s'
                IGNORE 1 LINES
                (@source_url, @title_ko, @content)
                SET
                  url          = @source_url,
                  title        = @title_ko,
                  content      = TRIM(@content),
                  content_hash = LOWER(SHA2(TRIM(@content), 256));
                """.formatted(escaped, lines);

        jdbc.execute(loadSql);

        Long after = jdbc.queryForObject("SELECT COUNT(*) FROM fact", Long.class);
        log.info("[FactCsvInitializer] load complete. rows={}", after);
    }
}
