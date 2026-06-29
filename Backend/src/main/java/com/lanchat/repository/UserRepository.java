package com.lanchat.repository;

import com.lanchat.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User,String> {
    boolean existsByUniqueId(String uniqueId);
    Optional<User> findByUniqueId(String uniqueId);
}
