package com.c102.picky;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PickyApplication {

    public static void main(String[] args) {
        SpringApplication.run(PickyApplication.class, args);
    }

}
