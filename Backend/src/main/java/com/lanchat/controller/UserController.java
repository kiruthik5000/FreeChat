package com.lanchat.controller;

import com.lanchat.config.AuthService;
import com.lanchat.dto.LoginDto;
import com.lanchat.dto.UserDto;
import com.lanchat.entity.User;
import com.lanchat.repository.UserRepository;
import com.lanchat.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    // get
    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService,  AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/create")
    public boolean createUser(@RequestBody UserDto user) throws Exception {
        return authService.signUp(user);
    }

    @PostMapping("/login")
    public User login(@RequestBody LoginDto loginDto) throws Exception {
        return authService.loginUser(loginDto);
    }
}
