package com.lanchat.service;

import com.lanchat.entity.Chat;
import com.lanchat.exception.GroupNotFoundException;
import com.lanchat.repository.ChatRepository;
import com.lanchat.repository.GroupRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;


@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final GroupRepository groupRepository;

    public ChatService(ChatRepository chatRepository,  GroupRepository groupRepository) {
        this.chatRepository = chatRepository;
        this.groupRepository = groupRepository;
    }

    // gettodaychats
    public List<Chat> findAllToday(String groupId){
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        return chatRepository.findAllByGroupIdCreatedBetween(groupId, startOfDay, endOfDay);
    }
    // getfunc
    public List<Chat> findAll(String groupId) throws Exception{
       return chatRepository.findAllByGroupId(groupId).orElseThrow(
               () -> new GroupNotFoundException("Cannot find the group")
       );
    }

    // create chat group
    public Chat save(Chat chat) throws Exception{
        if (groupRepository.findByGroupId(chat.getGroupId()).isEmpty()) throw new GroupNotFoundException("Cannot find the group");
        return chatRepository.save(chat);
    }

}
