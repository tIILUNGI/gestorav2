package com.ilungi.gestora.resources;

import com.ilungi.gestora.config.JwtTokenProvider;
import com.ilungi.gestora.entities.User;
import com.ilungi.gestora.repositories.UserRepository;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticação", description = "Operações de login e registro")
public class AuthResource {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    // LOGIN 
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        //Use o método que retorna Optional
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(401).body("Email ou senha inválidos");
        }
        
        User user = userOptional.get();
        
        // Verifica a senha
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Email ou senha inválidos");
        }
        
        // Gera token JWT
        String token = jwtTokenProvider.generateToken(
            user.getEmail(), 
            user.getId(), 
            user.getRole().name()
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole().name()
        ));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> userData) {
        try {
            // 1. Validação básica
            if (userData.get("email") == null || userData.get("email").isEmpty()) {
                return ResponseEntity.badRequest().body("Email é obrigatório");
            }
            
            if (userData.get("password") == null || userData.get("password").isEmpty()) {
                return ResponseEntity.badRequest().body("Senha é obrigatória");
            }
            
            String email = userData.get("email");
            
            // 2. Verifica se email já existe
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Email já cadastrado");
                return ResponseEntity.status(409).body(error); // 409 Conflict
            }
            
            // 3. Cria novo usuário
            User user = new User();
            user.setName(userData.get("name"));
            user.setEmail(email);
            user.setPhone(userData.get("phone"));
            
            // Criptografa a senha
            String rawPassword = userData.get("password");
            String encodedPassword = passwordEncoder.encode(rawPassword);
            user.setPassword(encodedPassword);
            
            // Define role padrão (USER)
            user.setRole(com.ilungi.gestora.entities.Role.USER);
            if (userData.get("role") == "ADMIN" || userData.get("role") == "Admin" || userData.get("role") != null ) {
            	  user.setRole(com.ilungi.gestora.entities.Role.ADMIN);
            }  
            // 4. Salva no banco
            User savedUser = userRepository.save(user);
            
            // 5. Gera token JWT
            String token = jwtTokenProvider.generateToken(
                savedUser.getEmail(), 
                savedUser.getId(), 
                savedUser.getRole().name()
            );
            
            // 6. Prepara resposta
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Usuário registrado com sucesso");
            response.put("token", token);
            response.put("user", Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().name()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro ao registrar usuário: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    //Método opcional para verificar se usuário está autenticado
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Token não fornecido");
        }
        
        try {
            String token = authHeader.substring(7);
            
            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.status(401).body("Token inválido");
            }
            
            String email = jwtTokenProvider.getEmailFromToken(token);
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(404).body("Usuário não encontrado");
            }
            
            User user = userOptional.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().name());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Erro de autenticação: " + e.getMessage());
        }
    }
    
    @RestController
    @RequestMapping("/api/debug")
    public class DebugController {
        
        @GetMapping("/cors")
        public Map<String, Object> corsTest(HttpServletRequest request) {
            Map<String, Object> response = new HashMap<>();
            response.put("timestamp", new Date());
            response.put("method", request.getMethod());
            response.put("origin", request.getHeader("Origin"));
            response.put("corsHeaders", Map.of(
                "Access-Control-Allow-Origin", request.getHeader("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods", request.getHeader("Access-Control-Allow-Methods")
            ));
            return response;
        }
        
        @RequestMapping(value = "/cors", method = RequestMethod.OPTIONS)
        public ResponseEntity<?> corsOptions() {
            return ResponseEntity.ok().build();
        }
    }
}