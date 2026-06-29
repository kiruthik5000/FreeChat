package com.lanchat.controller;

import com.lanchat.dto.ChatDto;
import com.lanchat.entity.Chat;
import com.lanchat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;
@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate simpMessagingTemplate;


    @MessageMapping("/chat.send")
    public void chatSend(ChatDto chatDto) throws Exception {
        ChatDto savedChat = chatService.save(chatDto);
        simpMessagingTemplate.convertAndSend("/topic/group"+ chatDto.getGroupId(), savedChat);
    }
}
