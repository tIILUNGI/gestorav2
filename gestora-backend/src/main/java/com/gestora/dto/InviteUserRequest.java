package com.gestora.dto;

import com.gestora.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteUserRequest {
    private String email;
    private String name;
    private User.UserRole role;
    private String tempPassword;
}
