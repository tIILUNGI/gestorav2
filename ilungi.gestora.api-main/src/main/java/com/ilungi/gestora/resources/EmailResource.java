package com.ilungi.gestora.resources;

import com.ilungi.gestora.entities.Email;
import com.ilungi.gestora.servicies.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emails")
public class EmailResource{
    
    @Autowired
    private EmailService emailService;
    
    @PostMapping("/enviar")
    public ResponseEntity<String> enviarEmail(
            @RequestBody Map<String, String> request) {
        
        String destinatario = request.get("destinatario");
        String assunto = request.get("assunto");
        String corpo = request.get("corpo");
        String tipo = request.getOrDefault("tipo", "usuario");
        
        if (destinatario == null || assunto == null || corpo == null) {
            return ResponseEntity.badRequest().body("Destinatário, assunto e corpo são obrigatórios");
        }
        
        emailService.enviarEmail(destinatario, assunto, corpo, tipo);
        return ResponseEntity.ok("Email agendado para envio");
    }
    
    /*@PostMapping("/boas-vindas")
    public ResponseEntity<String> enviarBoasVindas(
            @RequestBody Map<String, String> request) {
        
        String email = request.get("email");
        String nome = request.get("nome");
        
        if (email == null || nome == null) {
            return ResponseEntity.badRequest().body("Email e nome são obrigatórios");
        }
        
        emailService.enviarBoasVindas(email, nome);
        return ResponseEntity.ok("Email de boas-vindas agendado");
    }*/
    
    @PostMapping("/recuperacao-senha")
    public ResponseEntity<String> enviarRecuperacaoSenha(
            @RequestBody Map<String, String> request) {
        
        String email = request.get("email");
        String token = request.get("token");
        
        if (email == null || token == null) {
            return ResponseEntity.badRequest().body("Email e token são obrigatórios");
        }
        
        emailService.enviarRecuperacaoSenha(email, token);
        return ResponseEntity.ok("Email de recuperação agendado");
    }
    
    @PostMapping("/notificar-admin")
    public ResponseEntity<String> notificarAdmin(
            @RequestBody Map<String, String> request) {
        
        String assunto = request.get("assunto");
        String corpo = request.get("corpo");
        
        if (assunto == null || corpo == null) {
            return ResponseEntity.badRequest().body("Assunto e corpo são obrigatórios");
        }
        
        emailService.notificarTodosAdmins(assunto, corpo);
        return ResponseEntity.ok("Notificação para admins agendada");
    }
    
    @GetMapping("/pendentes")
    public ResponseEntity<List<Email>> listarEmailsPendentes() {
        List<Email> emails = emailService.buscarEmailsPendentes();
        return ResponseEntity.ok(emails);
    }
    
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Email>> listarEmailsPorTipo(@PathVariable String tipo) {
        List<Email> emails = emailService.buscarEmailsPorTipo(tipo);
        return ResponseEntity.ok(emails);
    }
    
    @GetMapping("/destinatario/{email}")
    public ResponseEntity<List<Email>> listarEmailsPorDestinatario(@PathVariable String email) {
        List<Email> emails = emailService.buscarEmailsPorDestinatario(email);
        return ResponseEntity.ok(emails);
    }
    
    @GetMapping("/estatisticas")
    public ResponseEntity<Map<String, Object>> getEstatisticas() {
        long enviados = emailService.contarEmailsEnviados();
        
        return ResponseEntity.ok(Map.of(
            "emailsEnviados", enviados,
            "status", "SUCESSO"
        ));
    }
    
    @PostMapping("/reenviar/{id}")
    public ResponseEntity<String> reenviarEmail(@PathVariable Long id) {
        emailService.reenviarEmail(id);
        return ResponseEntity.ok("Reenvio do email agendado");
    }
}