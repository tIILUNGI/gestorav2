package com.ilungi.gestora.repositories;

import com.ilungi.gestora.entities.Email;
import com.ilungi.gestora.entities.StatusEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {
    
    List<Email> findByStatus(StatusEmail status);
    
    List<Email> findByDestinatario(String destinatario);
    
    List<Email> findByTipo(String tipo);
    
    List<Email> findByDataEnvioBetween(LocalDateTime inicio, LocalDateTime fim);
    
    List<Email> findByStatusAndTipo(StatusEmail status, String tipo);
    
    long countByStatus(StatusEmail status);
}