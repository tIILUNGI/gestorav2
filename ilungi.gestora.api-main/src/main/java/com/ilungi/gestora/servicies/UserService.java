package com.ilungi.gestora.servicies;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ilungi.gestora.entities.Role;
import com.ilungi.gestora.entities.User;
import com.ilungi.gestora.repositories.UserRepository;

@Service
public class UserService {
    
    @Autowired
    private UserRepository repository;
    
    @Autowired
    private PasswordEncoder passwordEncoder; // Para criptografar senhas
    
    public List<User> findAll() {
        return repository.findAll();
    }
    
    public User findById(Long id) {
        Optional<User> obj = repository.findById(id);
        return obj.orElseThrow(() -> new RuntimeException("Usuário não encontrado com ID: " + id));
    }
    
    public User findByEmail(String email) {
        Optional<User> obj = repository.findByEmail(email);
        return obj.orElseThrow(() -> new RuntimeException("Usuário não encontrado com email: " + email));
    }
    
    public Optional<User> findByEmailOptional(String email) {
        return repository.findByEmail(email);
    }
    
    // Método para verificar se email existe
    public boolean emailExists(String email) {
        return repository.findByEmail(email).isPresent();
    }
    

    
    // 1. Criar usuário com validação
    public User createUser(User user) {
        // Valida se email já existe
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email já cadastrado: " + user.getEmail());
        }
        
        // Criptografa a senha se fornecida
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            String encodedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encodedPassword);
        }
        
        // Define role padrão se não especificada
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        
        user.setId(null); // Garante que é um novo registro
        return repository.save(user);
    }
    
    // 2. Atualizar usuário (updateUser)
    public User updateUser(Long id, User userData) {
        User user = findById(id); // Busca usuário existente
        
        // Atualiza campos se fornecidos
        if (userData.getName() != null) {
            user.setName(userData.getName());
        }
        
        // Atualiza email com verificação
        if (userData.getEmail() != null && !userData.getEmail().equals(user.getEmail())) {
            // Verifica se novo email não está sendo usado por outro usuário
            Optional<User> existingUser = repository.findByEmail(userData.getEmail());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                throw new RuntimeException("Email já está em uso por outro usuário");
            }
            user.setEmail(userData.getEmail());
        }
        
        if (userData.getPhone() != null) {
            user.setPhone(userData.getPhone());
        }
        
        // Atualiza senha (se fornecida e não vazia)
        if (userData.getPassword() != null && !userData.getPassword().isEmpty()) {
            String encodedPassword = passwordEncoder.encode(userData.getPassword());
            user.setPassword(encodedPassword);
        }
        
        // Atualiza role (apenas se for ADMIN no controle)
        if (userData.getRole() != null) {
            user.setRole(userData.getRole());
        }
        
        return repository.save(user);
    }
    
    // 3. Deletar usuário
    public void deleteUser(Long id) {
        User user = findById(id);
        repository.delete(user);
    }
    
    // 4. Mudar role do usuário (changeRole)
    public User changeRole(Long userId, Role newRole) {
        User user = findById(userId);
        user.setRole(newRole);
        return repository.save(user);
    }
    
    // 5. Buscar usuários por role
    public List<User> findByRole(Role role) {
        return repository.findByRole(role);
    }
    
    // 6. Buscar usuários por nome (like)
    public List<User> findByNameContaining(String name) {
        return repository.findByNameContainingIgnoreCase(name);
    }
    
    // 7. Verificar se usuário é admin
    public boolean isAdmin(Long userId) {
        User user = findById(userId);
        return user.getRole() == Role.ADMIN;
    }
    
    // 8. Atualizar apenas senha
    public User updatePassword(Long userId, String newPassword) {
        User user = findById(userId);
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        return repository.save(user);
    }
    
    // 9. Atualizar apenas perfil (nome, telefone)
    public User updateProfile(Long userId, String name, String phone) {
        User user = findById(userId);
        
        if (name != null) {
            user.setName(name);
        }
        
        if (phone != null) {
            user.setPhone(phone);
        }
        
        return repository.save(user);
    }
    
    // 10. Método para login (verifica credenciais)
    public Optional<User> authenticate(String email, String rawPassword) {
        Optional<User> userOptional = repository.findByEmail(email);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Verifica se a senha corresponde
            if (passwordEncoder.matches(rawPassword, user.getPassword())) {
                return Optional.of(user);
            }
        }
        
        return Optional.empty();
    }
}