package com.ilungi.gestora.resources;

import com.ilungi.gestora.entities.Task;
import com.ilungi.gestora.entities.TaskStatus;
import com.ilungi.gestora.entities.User;
import com.ilungi.gestora.entities.Role;
import com.ilungi.gestora.servicies.EmailService;
import com.ilungi.gestora.servicies.PasswordGeneratorService;
import com.ilungi.gestora.servicies.TaskService;
import com.ilungi.gestora.repositories.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Administração", description = "Operações administrativas - Apenas para ADMIN")
public class AdminResource {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TaskService taskService;
    
    @Autowired 
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    
    @Autowired
    private PasswordGeneratorService passwordGenerator;
    
    // ========== GERENCIAMENTO DE USUÁRIOS ==========
    
    @GetMapping("/users")
    @Operation(summary = "Listar todos os usuários")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        List<Map<String, Object>> response = users.stream()
            .map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", user.getName());
                userMap.put("email", user.getEmail());
                userMap.put("phone", user.getPhone());
                userMap.put("role", user.getRole().name());
                userMap.put("createdAt", user.getCreatedAt());
                userMap.put("updatedAt", user.getUpdatedAt());
                // Estatísticas - use getAssignedTasks() em vez de tasks
                userMap.put("taskCount", user.getAssignedTasks() != null ? user.getAssignedTasks().size() : 0);
                userMap.put("createdTaskCount", user.getCreatedTasks() != null ? user.getCreatedTasks().size() : 0);
                return userMap;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/users/{id}")
    @Operation(summary = "Buscar usuário por ID")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(404).body("Usuário não encontrado");
        }
        
        User user = userOptional.get();
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole().name());
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());
        
     
        if (user.getAssignedTasks() != null) {
            Map<TaskStatus, Long> taskStats = user.getAssignedTasks().stream()
                .collect(Collectors.groupingBy(
                    Task::getStatus,
                    Collectors.counting()
                ));
            response.put("taskStats", taskStats);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/users")
    @Operation(summary = "Criar novo usuário (Admin)")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> userData) {
        try {
            // Validação
            if (userData.get("email") == null || userData.get("email").isEmpty()) {
                return ResponseEntity.badRequest().body("Email é obrigatório");
            }
            
            String email = userData.get("email");
            String nome = userData.get("name");
            
            // Verifica se email já existe
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                return ResponseEntity.status(409).body(Map.of("error", "Email já cadastrado"));
            }
            
            // Cria novo usuário
            User user = new User();
            user.setName(nome);
            user.setEmail(email);
            user.setPhone(userData.get("phone"));
            
            // Senha (se não fornecida, gera uma padrão)
            String rawPassword = passwordGenerator.generateUserPassword();
            if (rawPassword == null || rawPassword.isEmpty()) {
                rawPassword = passwordGenerator.generateUserPassword();
            }
            user.setPassword(passwordEncoder.encode(rawPassword));
            
            // Role (padrão: USER)
            String roleStr = userData.get("role");
            if (roleStr != null && roleStr.equalsIgnoreCase("ADMIN")) {
                user.setRole(Role.ADMIN);
            } else {
                user.setRole(Role.USER);
            }
            
            User savedUser = userRepository.save(user);
            
            //ENVIA EMAIL DE BOAS-VINDAS COM SENHA
            emailService.enviarBoasVindasInicial(email, nome, rawPassword);
            
            //NOTIFICA ADMIN SOBRE NOVO USUÁRIO
            emailService.notificarAdminNovoUsuario(nome, email);
            
            // Resposta sem a senha
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Usuário criado com sucesso. Email de boas-vindas enviado!");
            response.put("user", Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail(),
                "phone", savedUser.getPhone(),
                "role", savedUser.getRole().name()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao criar usuário: " + e.getMessage()));
        }
    }

    
    
    
    @PutMapping("/users/{id}")
    @Operation(summary = "Atualizar usuário")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> userData) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(404).body("Usuário não encontrado");
            }
            
            User user = userOptional.get();
            
            // Atualiza campos se fornecidos
            if (userData.get("name") != null) {
                user.setName(userData.get("name"));
            }
            if (userData.get("phone") != null) {
                user.setPhone(userData.get("phone"));
            }
            if (userData.get("role") != null) {
                try {
                    Role role = Role.valueOf(userData.get("role").toUpperCase());
                    user.setRole(role);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body("Role inválido. Use: ADMIN ou USER");
                }
            }
            
            User updatedUser = userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Usuário atualizado com sucesso");
            response.put("user", Map.of(
                "id", updatedUser.getId(),
                "name", updatedUser.getName(),
                "email", updatedUser.getEmail(),
                "phone", updatedUser.getPhone(),
                "role", updatedUser.getRole().name()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao atualizar usuário: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/users/{id}")
    @Operation(summary = "Excluir usuário")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(404).body("Usuário não encontrado");
            }
            
            User user = userOptional.get();
            
            // Verifica se o usuário tem tarefas atribuídas (usando assignedTasks)
            if (!user.getAssignedTasks().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body("Não é possível excluir usuário com tarefas atribuídas. Reatribua as tarefas primeiro.");
            }
            
            userRepository.delete(user);
            
            return ResponseEntity.ok(Map.of("message", "Usuário excluído com sucesso"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao excluir usuário: " + e.getMessage()));
        }
    }
    
    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Alterar role do usuário")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestParam String role) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(404).body("Usuário não encontrado");
            }
            
            User user = userOptional.get();
            
            try {
                Role newRole = Role.valueOf(role.toUpperCase());
                user.setRole(newRole);
                userRepository.save(user);
                
                return ResponseEntity.ok(Map.of(
                    "message", "Role alterado com sucesso",
                    "userId", user.getId(),
                    "newRole", newRole.name()
                ));
                
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Role inválido. Use: ADMIN ou USER");
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao alterar role: " + e.getMessage()));
        }
    }
    
    @GetMapping("/users/by-role/{role}")
    @Operation(summary = "Buscar usuários por role")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            Role roleEnum;
            try {
                roleEnum = Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Role inválido. Use: ADMIN ou USER");
            }
            
            List<User> users = userRepository.findByRole(roleEnum);
            
            // CORREÇÃO DA LINHA 290: Especifique o tipo explicitamente
            List<Map<String, Object>> response = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("name", user.getName());
                    userMap.put("email", user.getEmail());
                    userMap.put("phone", user.getPhone());
                    userMap.put("role", user.getRole().name());
                    userMap.put("taskCount", user.getAssignedTasks() != null ? user.getAssignedTasks().size() : 0);
                    return userMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao buscar usuários: " + e.getMessage()));
        }
    }
    
    // ========== GERENCIAMENTO DE TAREFAS (ADMIN) ==========
    
    @GetMapping("/tasks")
    @Operation(summary = "Listar todas as tarefas")
    public ResponseEntity<List<Task>> getAllTasks() {
        List<Task> tasks = taskService.findAllTasksAdmin();
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/tasks/user/{userId}")
    @Operation(summary = "Listar tarefas de um usuário específico")
    public ResponseEntity<?> getTasksByUser(@PathVariable Long userId) {
        try {
            List<Task> tasks = taskService.findTasksByUser(userId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/tasks/{taskId}/assign/{userId}")
    @Operation(summary = "Atribuir usuário a uma tarefa")
    public ResponseEntity<?> assignUserToTask(
            @PathVariable Long taskId, 
            @PathVariable Long userId) {
        try {
            Task task = taskService.assignTaskToUser(taskId, userId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
 // ========== CRIAR TAREFA COM RESPONSÁVEIS ==========

    @PostMapping("/tasks")
    @Operation(summary = "Criar nova tarefa e atribuir responsáveis")
    public ResponseEntity<?> createTaskWithResponsibles(@RequestBody Map<String, Object> taskData) {
        try {
            //logger.info("📝 ADMIN CRIANDO NOVA TAREFA COM RESPONSÁVEIS");
            //logger.info("Dados recebidos: {}", taskData);
            
            // 1. Validação básica
            if (taskData.get("title") == null || ((String) taskData.get("title")).isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Título da tarefa é obrigatório"));
            }
            
            if (taskData.get("responsibles") == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Pelo menos um responsável deve ser informado"));
            }
            
            // 2. Extrai dados da tarefa
            String title = (String) taskData.get("title");
            String description = (String) taskData.get("description");
            Integer daysToFinish = (Integer) taskData.get("daysToFinish");
            String statusStr = (String) taskData.get("status");
            
            // 3. Cria nova tarefa
            Task task = new Task();
            task.setTitle(title);
            task.setDescription(description);
            task.setDaysToFinish(daysToFinish);
            task.setCreateAt(new Date());
            
            // 4. Define status (padrão: PENDENTE)
            if (statusStr != null) {
                try {
                    TaskStatus status = TaskStatus.valueOf(statusStr.toUpperCase());
                    task.setStatus(status);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Status inválido. Use: PENDENTE, EM_PROGRESSO, CONCLUIDA"));
                }
            } else {
                task.setStatus(TaskStatus.PENDING);
            }
            
            // 5. Calcula data de término se daysToFinish for fornecido
            if (daysToFinish != null && daysToFinish > 0) {
                Calendar calendar = Calendar.getInstance();
                calendar.setTime(new Date());
                calendar.add(Calendar.DAY_OF_MONTH, daysToFinish);
                task.setEndDate(calendar.getTime());
            }
            
            // 6. Obtém e valida responsáveis
            @SuppressWarnings("unchecked")
            List<Object> responsiblesData = (List<Object>) taskData.get("responsibles");
            List<User> responsibles = new ArrayList<>();
            
            if (responsiblesData.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Pelo menos um responsável deve ser informado"));
            }
            
            for (Object respData : responsiblesData) {
                Long userId;
                
                if (respData instanceof Integer) {
                    userId = ((Integer) respData).longValue();
                } else if (respData instanceof Long) {
                    userId = (Long) respData;
                } else if (respData instanceof String) {
                    try {
                        userId = Long.parseLong((String) respData);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest()
                            .body(Map.of("error", "ID de responsável inválido: " + respData));
                    }
                } else {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Formato de responsável inválido"));
                }
                
                // Busca usuário no banco
                Optional<User> userOptional = userRepository.findById(userId);
                if (userOptional.isEmpty()) {
                    return ResponseEntity.status(404)
                        .body(Map.of("error", "Usuário responsável não encontrado: ID " + userId));
                }
                
                User user = userOptional.get();
                responsibles.add(user);
                //logger.info("✅ Responsável adicionado: {} ({})", user.getName(), user.getEmail());
            }
            
            // 7. Define responsáveis na tarefa
            task.setResponsibles(responsibles);
            
            // 8. Salva a tarefa (TaskService deve lidar com a persistência)
            Task savedTask = taskService.createTaskWithResponsibles(task);
            
           // logger.info("✅ Tarefa criada com sucesso. ID: {}", savedTask.getId());
            
            // 9. Envia notificações por email para cada responsável
            sendTaskNotifications(savedTask);
            
            // 10. Prepara resposta
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tarefa criada com sucesso e atribuída aos responsáveis");
            response.put("task", buildTaskResponse(savedTask));
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (ClassCastException e) {
            //logger.error("❌ Erro de conversão de tipos no JSON", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Formato de dados inválido: " + e.getMessage()));
        } catch (Exception e) {
            //logger.error("❌ Erro ao criar tarefa", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao criar tarefa: " + e.getMessage()));
        }
    }

    /**
     * Envia notificações por email para os responsáveis
     */
    private void sendTaskNotifications(Task task) {
        if (task.getResponsibles() == null || task.getResponsibles().isEmpty()) {
            return;
        }
        
        for (User responsible : task.getResponsibles()) {
            try {
                emailService.notificarResponsavelTarefa(
                    responsible.getEmail(),
                    responsible.getName(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getEndDate(),
                    task.getStatus()
                );
                //logger.info("📧 Notificação enviada para: {} ({})", 
                           //responsible.getName(), responsible.getEmail());
            } catch (Exception e) {
                //logger.error("❌ Erro ao enviar notificação para {}: {}", 
                            //responsible.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * Constrói resposta detalhada da tarefa
     */
    private Map<String, Object> buildTaskResponse(Task task) {
        Map<String, Object> taskMap = new HashMap<>();
        taskMap.put("id", task.getId());
        taskMap.put("title", task.getTitle());
        taskMap.put("description", task.getDescription());
        taskMap.put("status", task.getStatus().name());
        taskMap.put("createAt", task.getCreateAt());
        taskMap.put("endDate", task.getEndDate());
        taskMap.put("daysToFinish", task.getDaysToFinish());
        
        // Informações do criador
        if (task.getCreatedBy() != null) {
            taskMap.put("createdBy", Map.of(
                "id", task.getCreatedBy().getId(),
                "name", task.getCreatedBy().getName(),
                "email", task.getCreatedBy().getEmail()
            ));
        }
        
        // Lista de responsáveis
        List<Map<String, Object>> responsiblesList = new ArrayList<>();
        if (task.getResponsibles() != null) {
            for (User responsible : task.getResponsibles()) {
                Map<String, Object> respMap = new HashMap<>();
                respMap.put("id", responsible.getId());
                respMap.put("name", responsible.getName());
                respMap.put("email", responsible.getEmail());
                respMap.put("phone", responsible.getPhone());
                responsiblesList.add(respMap);
            }
        }
        taskMap.put("responsibles", responsiblesList);
        taskMap.put("totalResponsibles", responsiblesList.size());
        
        return taskMap;
    }
    
    
    @PostMapping("/tasks/{taskId}/assign-multiple")
    @Operation(summary = "Atribuir múltiplos usuários a uma tarefa")
    public ResponseEntity<?> assignMultipleUsersToTask(
            @PathVariable Long taskId,
            @RequestBody List<Long> userIds) {
        try {
            Task task = taskService.assignMultipleUsersToTask(taskId, userIds);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/tasks/{taskId}/assign/{userId}")
    @Operation(summary = "Remover usuário de uma tarefa")
    public ResponseEntity<?> removeUserFromTask(
            @PathVariable Long taskId, 
            @PathVariable Long userId) {
        try {
            Task task = taskService.removeUserFromTask(taskId, userId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Estatísticas gerais do sistema")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Estatísticas de usuários
        long totalUsers = userRepository.count();
        long adminUsers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.ADMIN)
            .count();
        long regularUsers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.USER)
            .count();
        
        stats.put("totalUsers", totalUsers);
        stats.put("adminUsers", adminUsers);
        stats.put("regularUsers", regularUsers);
        
        // Estatísticas de tarefas
        Map<com.ilungi.gestora.entities.TaskStatus, Long> taskStats = taskService.getAllTaskStats();
        stats.put("taskStats", taskStats);
        
        long totalTasks = taskStats.values().stream().mapToLong(Long::longValue).sum();
        stats.put("totalTasks", totalTasks);
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/dashboard")
    @Operation(summary = "Dados para dashboard administrativo")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Dados resumidos
        dashboard.put("systemInfo", Map.of(
            "name", "Gestora API",
            "version", "1.0.0",
            "activeUsers", userRepository.count(),
            "activeTasks", taskService.findAllTasksAdmin().size()
        ));
        
        
        List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
        
        
        List<Map<String, Object>> recentUsersData = recentUsers.stream()
            .map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", user.getName());
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole().name());
                userMap.put("createdAt", user.getCreatedAt());
                return userMap;
            })
            .collect(Collectors.toList());
        
        dashboard.put("recentUsers", recentUsersData);
        
        return ResponseEntity.ok(dashboard);
    }
}