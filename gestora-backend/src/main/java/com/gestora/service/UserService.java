package com.gestora.service;

import com.gestora.dto.InviteResponse;
import com.gestora.dto.InviteUserRequest;
import com.gestora.model.User;
import com.gestora.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.invite.expiry-hours:24}")
    private long inviteExpiryHours;

    private final SecureRandom secureRandom = new SecureRandom();

    public User createUser(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email já cadastrado");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);

        return userRepository.save(user);
    }

    public InviteResponse inviteUser(InviteUserRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email é obrigatório");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email já cadastrado");
        }

        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            name = email.split("@")[0];
        }

        User.UserRole role = request.getRole() != null ? request.getRole() : User.UserRole.EMPLOYEE;

        String tempPassword = request.getTempPassword();
        if (tempPassword == null || tempPassword.trim().length() < 6) {
            throw new RuntimeException("Senha temporária deve ter pelo menos 6 caracteres");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPosition(request.getPosition());
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(tempPassword.trim()));
        user.setMustChangePassword(true);

        User saved = userRepository.save(user);

        boolean emailSent = emailService.sendTempCredentialsEmail(email, tempPassword.trim());

        return InviteResponse.builder()
            .user(com.gestora.dto.UserDTO.of(saved))
            .emailSent(emailSent)
            .inviteLink("")
            .build();
    }

    public User completeInvite(String token, String newPassword) {
        if (token == null || token.trim().isEmpty()) {
            throw new RuntimeException("Token inválido");
        }
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("Senha deve ter pelo menos 6 caracteres");
        }

        User user = userRepository.findByInviteToken(token)
            .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (user.getInviteTokenExpiry() != null && user.getInviteTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expirado");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setInviteToken(null);
        user.setInviteTokenExpiry(null);

        return userRepository.save(user);
    }

    public void changePasswordByEmail(String email, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("Senha deve ter pelo menos 6 caracteres");
        }
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (userDetails.getName() != null) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getAvatar() != null) {
            user.setAvatar(userDetails.getAvatar());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        if (userDetails.getPosition() != null) {
            user.setPosition(userDetails.getPosition());
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private String generateInviteToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateTempPassword() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String buildInviteLink(String token) {
        String base = frontendBaseUrl == null ? "" : frontendBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (base.isEmpty()) {
            base = "http://localhost:5173";
        }
        return base + "/?invite=" + token;
    }
}
