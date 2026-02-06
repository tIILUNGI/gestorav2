package com.ilungi.gestora.resources;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


import com.ilungi.gestora.entities.Role;
import com.ilungi.gestora.entities.User;
import com.ilungi.gestora.servicies.EmailService;
import com.ilungi.gestora.servicies.UserService;

@RestController
@RequestMapping("/users")
public class UserResource {
    
    @Autowired
    private UserService userService;
    
  
    
    // Atualizar usuário
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userData) {
        User updatedUser = userService.updateUser(id, userData);
        return ResponseEntity.ok(updatedUser);
    }
    
    // Deletar usuário
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
    
    // Mudar role (apenas para admin)
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> changeRole(@PathVariable Long id, @RequestParam Role role) {
        User updatedUser = userService.changeRole(id, role);
        return ResponseEntity.ok(updatedUser);
    }
    
    // Atualizar senha
    @PatchMapping("/{id}/password")
    public ResponseEntity<User> updatePassword(@PathVariable Long id, @RequestBody Map<String, String> data) {
        String newPassword = data.get("password");
        User updatedUser = userService.updatePassword(id, newPassword);
        return ResponseEntity.ok(updatedUser);
    }
    
    // Atualizar perfil
    @PatchMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> data) {
        String name = data.get("name");
        String phone = data.get("phone");
        User updatedUser = userService.updateProfile(id, name, phone);
        return ResponseEntity.ok(updatedUser);
    }
}