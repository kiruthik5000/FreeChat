package com.lanchat.entity;


import lombok.*;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "chats")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Chat extends BaseEntity {

    private String name;
    private String groupId;
    private String message;
}
