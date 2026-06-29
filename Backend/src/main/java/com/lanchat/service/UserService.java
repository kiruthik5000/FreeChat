package com.lanchat.service;

import com.lanchat.dto.UserDto;
import com.lanchat.entity.User;
import com.lanchat.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
