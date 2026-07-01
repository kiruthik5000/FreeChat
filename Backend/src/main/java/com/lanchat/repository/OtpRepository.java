package com.lanchat.repository;

import com.lanchat.entity.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpRepository extends MongoRepository<Otp, String> {
    Optional<Otp> findByUniqueId(String uniqueId);
    void deleteByUniqueId(String uniqueId);
}
