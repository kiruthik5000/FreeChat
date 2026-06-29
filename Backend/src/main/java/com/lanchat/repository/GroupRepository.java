package com.lanchat.repository;

import com.lanchat.entity.Group;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends MongoRepository<Group,String> {
    Optional<Group> findByGroupId(String groupId);
}
