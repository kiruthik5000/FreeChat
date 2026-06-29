package com.lanchat.controller;

import com.lanchat.dto.GroupDto;
import com.lanchat.entity.Group;
import com.lanchat.service.GroupService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping("/")
    public List<Group> getAllGroups() {
        return groupService.getAllGroups();
    }

    @PostMapping("/create")
    public Group createGroup(@RequestBody GroupDto groupDto) throws Exception {
        return groupService.create(groupDto);
    }

    @DeleteMapping("/delete")
    public String deleteGroup(@RequestParam String groupId, @RequestParam String userId) throws Exception {
        groupService.deleteGroup(groupId, userId);
        return "Successfully deleted group";
    }
}
