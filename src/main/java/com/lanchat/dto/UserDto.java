package com.lanchat.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
public class UserDto {
    private String uniqueId;
    private String name;
    private String password;
}
