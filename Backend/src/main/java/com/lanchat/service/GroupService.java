package com.lanchat.service;

import com.lanchat.dto.GroupDto;
import com.lanchat.entity.Group;
import com.lanchat.exception.GroupNotFoundException;
import com.lanchat.exception.UserUnauthorizedException;
import com.lanchat.repository.GroupRepository;
import com.lanchat.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public GroupService(GroupRepository groupRepository, UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }
    public List<Group> getAllGroups() {

        return groupRepository.findAll();
    }
    // create group
    public Group create(GroupDto group) throws Exception {
        Group groupEntity = new Group();
        groupEntity.setGroupName(group.getGroupName());
        return groupRepository.save(groupEntity);
    }

    // delete group
    public void deleteGroup(String groupId, String userId) throws Exception {

        if (!isMaster(userId)) {
            throw new UserUnauthorizedException("Cannot delete group");
        }
        Group group = groupRepository.findByGroupId(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Cannot find the group"));
        groupRepository.delete(group);
    }

    private final boolean isMaster(String userId) {
        return userRepository.existsByUniqueId(userId);
    }
}
