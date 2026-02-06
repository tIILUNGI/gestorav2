package com.ilungi.gestora.repositories;

import com.ilungi.gestora.entities.Task;
import com.ilungi.gestora.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import com .ilungi.gestora.entities.TaskStatus;

public interface TaskRepository extends JpaRepository<Task, Long> {
    
    // Substituir o método antigo
    // List<Task> findByResponsible(User responsible);
    
    // Novo método para múltiplos responsáveis
    List<Task> findByResponsiblesContaining(User responsible);
    
    // Para tasks criadas por um usuário
    List<Task> findByCreatedBy(User createdBy);
    
    // Método para buscar tasks por status e responsável
    List<Task> findByStatusAndResponsiblesContaining(TaskStatus status, User responsible);
    
    // Método para contar tasks por responsável
    Long countByResponsiblesContaining(User responsible);
    
    // Buscar tasks que expiram em breve
    @Query("SELECT t FROM Task t WHERE t.endDate BETWEEN CURRENT_DATE AND :date AND t.status = 'PENDING'")
    List<Task> findTasksExpiringSoon(@Param("date") Date date);
}