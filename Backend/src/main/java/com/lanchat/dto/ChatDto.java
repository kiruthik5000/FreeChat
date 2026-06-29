package com.lanchat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ChatDto {
    private String id;
    private String groupId;
    private String senderName;
    private String message;
    private LocalDateTime createdAt;
}
