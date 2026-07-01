package com.lanchat.dto;

import com.lanchat.entity.MessageTypes;
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
    private String groupId;
    private String senderName;
    private MessageTypes type;
    private String content;
    private LocalDateTime createdAt;
}
