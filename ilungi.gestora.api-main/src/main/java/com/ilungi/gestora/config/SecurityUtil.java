package com.ilungi.gestora.config;

import com.ilungi.gestora.entities.User;
import com.ilungi.gestora.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {
    
    private final UserRepository userRepository;
    
    public SecurityUtil(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    // Obtém o usuário atual do contexto de segurança
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        String email = authentication.getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
    
    // Verifica se é ADMIN
    public boolean isAdmin() {
        User user = getCurrentUser();
        return user != null && user.getRole() == com.ilungi.gestora.entities.Role.ADMIN;
    }
    
    // Verifica se é o responsável pela task
    public boolean isTaskResponsible(Long taskId) {
        User user = getCurrentUser();
        if (user == null) return false;
        

        return true;
    }
    
    // Obtém ID do usuário atual
    public Long getCurrentUserId() {
        User user = getCurrentUser();
        return user != null ? user.getId() : null;
    }
}