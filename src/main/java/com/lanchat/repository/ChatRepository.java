package com.lanchat.repository;

import com.lanchat.entity.Chat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends MongoRepository<Chat ,String> {
    Optional<List<Chat>> findAllByGroupId(String groupId);
    @Query("""
{
  'groupId': ?0,
  'createdAt': {
    $gte: ?1,
    $lte: ?2
  }
}
""")
    List<Chat>

    findAllByGroupIdCreatedBetween(
            String groupId,
            LocalDateTime startOfDay,
            LocalDateTime endOfDay
    );
}
