package com.lanchat.dto;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class LoginDto {
    private String uniqueId;
    private String password;
}
