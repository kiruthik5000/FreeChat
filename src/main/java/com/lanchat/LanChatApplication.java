package com.lanchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class LanChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(LanChatApplication.class, args);
        System.out.println("LanChatApplication started successfully");
    }

}
