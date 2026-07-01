package com.lanchat.service;

import com.lanchat.dto.ChatDto;
import com.lanchat.entity.Chat;
import com.lanchat.exception.GroupNotFoundException;
import com.lanchat.mapper.ChatMapper;
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
    private final ChatMapper chatMapper;

    public ChatService(ChatRepository chatRepository,  GroupRepository groupRepository,  ChatMapper chatMapper) {
        this.chatRepository = chatRepository;
        this.groupRepository = groupRepository;
        this.chatMapper = chatMapper;
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
       return chatRepository.findByGroupIdOrderByCreatedAtAsc(groupId).orElseThrow(
               () -> new GroupNotFoundException("Cannot find the group")
       );
    }

    // create chat group
    public ChatDto save(ChatDto chat) throws Exception{
        if (!groupRepository.findById(chat.getGroupId()).isPresent()) {

        }
        if (groupRepository.findByGroupId(chat.getGroupId()).isEmpty()) throw new GroupNotFoundException("Cannot find the group");
        return chatMapper.toDto(chatRepository.save(chatMapper.toEntity(chat)));
    }

}
