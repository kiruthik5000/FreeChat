package com.lanchat.service;

import com.lanchat.dto.GroupDto;
import com.lanchat.entity.Group;
import com.lanchat.exception.GroupNotFoundException;
import com.lanchat.exception.UserUnauthorizedException;
import com.lanchat.repository.GroupRepository;
import com.lanchat.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public GroupService(GroupRepository groupRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }
    public List<Group> getAllGroups() {

        return groupRepository.findAll();
    }
    // create group
    public Group create(GroupDto group) throws Exception {
        Group groupEntity = new Group();
        groupEntity.setGroupName(group.getGroupName());
        Group saved = groupRepository.save(groupEntity);

        // Broadcast creation to all connected clients
        messagingTemplate.convertAndSend("/topic/group-created", saved);

        return saved;
    }

    // delete group
    public void deleteGroup(String groupId, String userId) throws Exception {

        if (!isMaster(userId)) {
            throw new UserUnauthorizedException("Cannot delete group");
        }
        Group group = groupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Cannot find the group"));
        groupRepository.delete(group);

        // Broadcast deletion to all connected clients
        Map<String, String> payload = Map.of(
                "type", "GROUP_DELETED",
                "groupId", groupId,
                "message", "This group has been deleted."
        );
        messagingTemplate.convertAndSend("/topic/group-deleted", payload);
        messagingTemplate.convertAndSend("/topic/group" + groupId, payload);
    }

    private final boolean isMaster(String userId) {
        return "MASTER".equals(userId);
    }
}

