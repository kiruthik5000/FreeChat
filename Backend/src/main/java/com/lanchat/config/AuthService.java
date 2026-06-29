package com.lanchat.config;

import com.lanchat.dto.LoginDto;
import com.lanchat.dto.UserDto;
import com.lanchat.entity.User;
import com.lanchat.exception.InvalidUniqueIdException;
import com.lanchat.exception.UserUnauthorizedException;
import com.lanchat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private PasswordEncoder passwordEncoder;

    public User loginUser(LoginDto loginDto) throws Exception{
        Optional<User> userOptional = userRepository.findByUniqueId(loginDto.getUniqueId());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
                user.setPassword(null); // don't expose hash to client
                return user;
            } else {
                throw new UserUnauthorizedException("Invalid credentials");
            }
        } else {
            throw new UserUnauthorizedException("Cannot find user");
        }
    }

    public boolean signUp(UserDto userDto) throws Exception {
        User user = new User();
        if (!userDto.getUniqueId().startsWith("727723EUIT")) throw new InvalidUniqueIdException("Unique Id must be collegeId");
        user.setUniqueId(userDto.getUniqueId());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setName(userDto.getName());
        userRepository.save(user);
        return true;
    }
}
