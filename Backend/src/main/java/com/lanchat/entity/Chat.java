package com.lanchat.entity;


import lombok.*;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;

@Document(collection = "chats")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Chat extends BaseEntity {

    private String name;
    private MessageTypes type;
    private String groupId;
    private String content;

    @Indexed(expireAfter = "1d")
    private Instant expiresAt = Instant.now();
}
