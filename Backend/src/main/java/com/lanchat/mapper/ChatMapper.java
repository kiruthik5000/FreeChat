package com.lanchat.mapper;

import com.lanchat.dto.ChatDto;
import com.lanchat.entity.Chat;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ChatMapper {

    public Chat toEntity(ChatDto dto){
        LocalDateTime now = LocalDateTime.now();
        return Chat.builder()
                .name(dto.getSenderName())
                .groupId(dto.getGroupId())
                .message(dto.getMessage())
                .expiresAt(now.plusDays(1))
                .build();
    }

    public ChatDto toDto(Chat chat){
        ChatDto chatDto = new ChatDto();
        chatDto.setId(chat.getId());
        chatDto.setSenderName(chat.getName());
        chatDto.setGroupId(chat.getGroupId());
        chatDto.setMessage(chat.getMessage());
        chatDto.setCreatedAt(chat.getCreatedAt());
        return chatDto;
    }
}
