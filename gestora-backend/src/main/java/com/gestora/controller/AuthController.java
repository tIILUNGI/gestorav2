package com.gestora.controller;

import com.gestora.config.JwtTokenProvider;
import com.gestora.dto.LoginRequest;
import com.gestora.dto.LoginResponse;
import com.gestora.dto.SetPasswordRequest;
import com.gestora.dto.UserDTO;
import com.gestora.model.User;
import com.gestora.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(loginRequest.getEmail());
            User user = userService.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            return ResponseEntity.ok(LoginResponse.of(jwt, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao fazer login: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest registerRequest) {
        try {
            User user = userService.createUser(
                registerRequest.getEmail(),
                registerRequest.getPassword(),
                registerRequest.getEmail().split("@")[0]
            );

            String jwt = tokenProvider.generateToken(user.getEmail());
            return ResponseEntity.ok(LoginResponse.of(jwt, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao registrar: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return ResponseEntity.ok(UserDTO.of(user));
    }

    @PostMapping("/set-password")
    public ResponseEntity<?> setPassword(@RequestBody SetPasswordRequest request) {
        try {
            userService.completeInvite(request.getToken(), request.getPassword());
            return ResponseEntity.ok(Map.of("success", true, "message", "Senha definida com sucesso"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao definir senha: " + e.getMessage()));
        }
    }
}
