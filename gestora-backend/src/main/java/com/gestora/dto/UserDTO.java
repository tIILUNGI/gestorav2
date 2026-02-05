package com.gestora.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.gestora.model.User;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String avatar;
    private String role;
    private boolean mustChangePassword;

    public static UserDTO of(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .avatar(user.getAvatar())
            .role(user.getRole().name())
            .mustChangePassword(user.isMustChangePassword())
            .build();
    }
}
