package com.ilungi.gestora.servicies;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ilungi.gestora.repositories.TaskRepository;
import com.ilungi.gestora.repositories.UserRepository;

import com.ilungi.gestora.config.SecurityUtil;
import com.ilungi.gestora.entities.Role;
import com.ilungi.gestora.entities.Task;
import com.ilungi.gestora.entities.TaskStatus;
import com.ilungi.gestora.entities.User;

@Service
public class TaskService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SecurityUtil securityUtil;
    
    
    public List<Task> findAll() {
        User currentUser = securityUtil.getCurrentUser();
        
        if (currentUser.getRole() == Role.ADMIN) {
            return taskRepository.findAll();
        } else {
            // Busca tarefas onde o usuário está na lista de responsáveis
            return taskRepository.findByResponsiblesContaining(currentUser);
        }
    }
    
    
    public Task findById(Long id) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task não encontrada"));
        
        User currentUser = securityUtil.getCurrentUser();
        
        // ADMIN pode ver qualquer task
        if (currentUser.getRole() == Role.ADMIN) {
            return task;
        }
        
        // USER só pode ver se estiver na lista de responsáveis
        boolean isResponsible = task.getResponsibles().stream()
            .anyMatch(user -> user.getId().equals(currentUser.getId()));
        
        if (!isResponsible) {
            throw new RuntimeException("Você não tem permissão para ver esta task");
        }
        
        return task;
    }
    
    @Transactional
    public Task createTaskWithResponsibles(Task task) {
        // Se a tarefa já tem ID, é update, não create
        if (task.getId() != null) {
            throw new IllegalArgumentException("Use updateTask para tarefas existentes");
        }
        
        // Define data de criação se não definida
        if (task.getCreateAt() == null) {
            task.setCreateAt(new Date());
        }
        
        // Salva a tarefa primeiro
        Task savedTask = taskRepository.save(task);
        
        // Atualiza a relação many-to-many
        if (task.getResponsibles() != null && !task.getResponsibles().isEmpty()) {
            // Para cada responsável, adiciona a tarefa na lista dele
            for (User responsible : task.getResponsibles()) {
                // Carrega o usuário do banco para garantir que está managed
                User managedUser = userRepository.findById(responsible.getId())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + responsible.getId()));
                
                // Adiciona a tarefa na lista do usuário
                managedUser.addAssignedTask(savedTask);
                userRepository.save(managedUser);
            }
        }
		return savedTask;
        
      }
    
    
    @Transactional
    public Task createTask(Task task) {
        User currentUser = securityUtil.getCurrentUser();
        
        // USER só pode criar tasks com ele mesmo na lista de responsáveis
        if (currentUser.getRole() == Role.USER) {
            if (task.getResponsibles() == null || task.getResponsibles().isEmpty()) {
                throw new RuntimeException("É necessário especificar pelo menos um responsável");
            }
            
            boolean hasCurrentUser = task.getResponsibles().stream()
                .anyMatch(user -> user.getId().equals(currentUser.getId()));
            
            if (!hasCurrentUser) {
                throw new RuntimeException("Usuários comuns só podem criar tasks onde são responsáveis");
            }
        }
        
        // Se não tiver responsáveis, adiciona o usuário atual
        if (task.getResponsibles() == null || task.getResponsibles().isEmpty()) {
            List<User> responsibles = new ArrayList<>();
            responsibles.add(currentUser);
            task.setResponsibles(responsibles);
        }
        
        // Garantir que os responsáveis existem no banco
        List<User> managedResponsibles = new ArrayList<>();
        for (User user : task.getResponsibles()) {
            if (user.getId() != null) {
                User managedUser = userRepository.findById(user.getId())
                    .orElseThrow(() -> new RuntimeException("Responsável não encontrado: " + user.getId()));
                managedResponsibles.add(managedUser);
            }
        }
        task.setResponsibles(managedResponsibles);
        
        // Definir criador da tarefa
        task.setCreatedBy(currentUser);
        
        task.setCreateAt(new Date());
        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.PENDING);
        }
        
        return taskRepository.save(task);
    }
    
    @Transactional
    public Task updateTask(Long id, Task taskUpdates) {
        Task task = findById(id); // Já valida permissão
        
        User currentUser = securityUtil.getCurrentUser();
        
        if (currentUser.getRole() == Role.USER) {
            // USER só pode atualizar se for responsável
            boolean isResponsible = task.getResponsibles().stream()
                .anyMatch(user -> user.getId().equals(currentUser.getId()));
            
            if (!isResponsible) {
                throw new RuntimeException("Você não tem permissão para atualizar esta task");
            }
            
            // USER pode atualizar: título, descrição e status
            if (taskUpdates.getTitle() != null) {
                task.setTitle(taskUpdates.getTitle());
            }
            if (taskUpdates.getDescription() != null) {
                task.setDescription(taskUpdates.getDescription());
            }
            if (taskUpdates.getStatus() != null) {
                task.setStatus(taskUpdates.getStatus());
            }
            // USER não pode mudar responsáveis nem data
        } else {
            // ADMIN pode atualizar tudo
            if (taskUpdates.getTitle() != null) {
                task.setTitle(taskUpdates.getTitle());
            }
            if (taskUpdates.getDescription() != null) {
                task.setDescription(taskUpdates.getDescription());
            }
            if (taskUpdates.getEndDate() != null) {
                task.setEndDate(taskUpdates.getEndDate());
            }
            if (taskUpdates.getStatus() != null) {
                task.setStatus(taskUpdates.getStatus());
            }
            
            // Atualizar responsáveis se fornecido
            if (taskUpdates.getResponsibles() != null) {
                List<User> managedResponsibles = new ArrayList<>();
                for (User user : taskUpdates.getResponsibles()) {
                    if (user.getId() != null) {
                        User managedUser = userRepository.findById(user.getId())
                            .orElseThrow(() -> new RuntimeException("Responsável não encontrado: " + user.getId()));
                        managedResponsibles.add(managedUser);
                    }
                }
                task.setResponsibles(managedResponsibles);
            }
        }
        
        return taskRepository.save(task);
    }
    
    
    
    // ADMIN pode deletar qualquer task, USER apenas tasks onde é responsável
    @Transactional
    public void deleteTask(Long id) {
        Task task = findById(id); // Já valida permissão de visualização
        
        User currentUser = securityUtil.getCurrentUser();
        
        // USER só pode deletar se for responsável
        if (currentUser.getRole() == Role.USER) {
            boolean isResponsible = task.getResponsibles().stream()
                .anyMatch(user -> user.getId().equals(currentUser.getId()));
            
            if (!isResponsible) {
                throw new RuntimeException("Você não tem permissão para deletar esta task");
            }
        }
        
        taskRepository.delete(task);
    }
    
    // Métodos específicos para USER
    @Transactional
    public Task updateMyTaskStatus(Long taskId, TaskStatus status) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task não encontrada"));
        
        User currentUser = securityUtil.getCurrentUser();
        
        // Verifica se está na lista de responsáveis
        boolean isResponsible = task.getResponsibles().stream()
            .anyMatch(user -> user.getId().equals(currentUser.getId()));
        
        if (!isResponsible) {
            throw new RuntimeException("Você só pode atualizar suas próprias tasks");
        }
        
        task.setStatus(status);
        return taskRepository.save(task);
    }
    
    public List<Task> findMyTasks() {
        User currentUser = securityUtil.getCurrentUser();
        return taskRepository.findByResponsiblesContaining(currentUser);
    }
    
    // Métodos apenas para ADMIN
    @PreAuthorize("hasRole('ADMIN')")
    public List<Task> findAllTasksAdmin() {
        return taskRepository.findAll();
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Task assignTaskToUser(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task não encontrada"));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        // Adiciona o usuário à lista de responsáveis
        if (!task.getResponsibles().contains(user)) {
            task.getResponsibles().add(user);
        }
        
        return taskRepository.save(task);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Task assignMultipleUsersToTask(Long taskId, List<Long> userIds) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task não encontrada"));
        
        List<User> users = userRepository.findAllById(userIds);
        
        // Adiciona todos os usuários à lista de responsáveis
        for (User user : users) {
            if (!task.getResponsibles().contains(user)) {
                task.getResponsibles().add(user);
            }
        }
        
        return taskRepository.save(task);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Task removeUserFromTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task não encontrada"));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        task.getResponsibles().remove(user);
        
        return taskRepository.save(task);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    public List<Task> findTasksByUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return taskRepository.findByResponsiblesContaining(user);
    }
    
    //para estatísticas
    public Map<TaskStatus, Long> getMyTaskStats() {
        User currentUser = securityUtil.getCurrentUser();
        List<Task> myTasks = taskRepository.findByResponsiblesContaining(currentUser);
        
        return myTasks.stream()
            .collect(Collectors.groupingBy(
                Task::getStatus,
                Collectors.counting()
            ));
    }
    
    // Método para ADMIN ver estatísticas gerais
    @PreAuthorize("hasRole('ADMIN')")
    public Map<TaskStatus, Long> getAllTaskStats() {
        List<Task> allTasks = taskRepository.findAll();
        
        return allTasks.stream()
            .collect(Collectors.groupingBy(
                Task::getStatus,
                Collectors.counting()
            ));
    }
}
