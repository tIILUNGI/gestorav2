package com.ilungi.gestora.repositories;

import com.ilungi.gestora.entities.Role;
import com.ilungi.gestora.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    // Métodos básicos
    Optional<User> findByEmail(String email);
    
    List<User> findByRole(Role role);
    
    long countByRole(Role role);
    
    // Para dashboard
    List<User> findTop5ByOrderByCreatedAtDesc();
    
    // Busca
    List<User> findByNameContainingIgnoreCase(String name);
    
    boolean existsByEmail(String email);
    
    // Estatísticas
    long countByCreatedAtAfter(LocalDateTime date);
    
    // ====== CORREÇÕES ======
    
    // 1. Se quiser manter um método para contar tarefas por usuário:
    @Query("SELECT u, SIZE(u.assignedTasks) as taskCount FROM User u ORDER BY taskCount DESC")
    List<Object[]> findUsersWithTaskCount();
    
    // 2. Ou se quiser uma consulta mais simples:
    @Query("SELECT u FROM User u LEFT JOIN u.assignedTasks t GROUP BY u ORDER BY COUNT(t) DESC")
    List<User> findUsersOrderByTaskCount();
    
    // 3. Método para buscar usuários com mais tarefas (para dashboard):
    @Query("SELECT u.id, u.name, u.email, COUNT(t) as taskCount " +
           "FROM User u LEFT JOIN u.assignedTasks t " +
           "GROUP BY u.id, u.name, u.email " +
           "ORDER BY taskCount DESC")
    List<Object[]> findTopUsersByTaskCount(@Param("limit") int limit);
    
    // 4. Método para contar tarefas de um usuário específico:
    @Query("SELECT COUNT(t) FROM User u JOIN u.assignedTasks t WHERE u.id = :userId")
    Long countTasksByUserId(@Param("userId") Long userId);
}
