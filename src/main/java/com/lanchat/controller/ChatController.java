package com.lanchat.controller;

import com.lanchat.entity.Chat;
import com.lanchat.service.ChatService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // getdaychats
    @GetMapping("/")
    public List<Chat> getChats(@RequestParam String groupId) throws Exception{
        return chatService.findAllToday(groupId);
    }

    @GetMapping("/all")
    public List<Chat> getAllChats(@RequestParam String groupId) throws Exception{
        return chatService.findAll(groupId);
    }

    // post
    @PostMapping("/post")
    public Chat createChat(@RequestBody Chat chat) throws Exception{
        return chatService.save(chat);
    }
}
