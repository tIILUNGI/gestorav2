package com.ilungi.gestora.servicies;

import com.ilungi.gestora.entities.Email;
import com.ilungi.gestora.entities.StatusEmail;
import com.ilungi.gestora.entities.TaskStatus;
import com.ilungi.gestora.repositories.EmailRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    @Autowired
    private EmailRepository emailRepository;
    
    @Value("${app.email.sender:no-reply@gestora.com}")
    private String senderEmail;
    
    @Value("${app.email.admin:admin@gestora.com}")
    private String adminEmail;
    
    @Value("${spring.mail.username:#{null}}")
    private String systemEmail;
    
    @Value("${spring.mail.host:localhost}")
    private String mailHost;  // Esta linha estava faltando!
    
    // Método principal com LOGS DETALHADOS
    @Async("taskExecutor")
    public void enviarEmail(String destinatario, String assunto, String corpo, String tipo) {
        
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        
        logger.info("******************************************************************");
        logger.info("TENTANDO ENVIAR EMAIL [{}]", timestamp);
        logger.info("├─ De: {}", senderEmail);
        logger.info("├─ Para: {}", destinatario);
        logger.info("├─ Assunto: {}", assunto);
        logger.info("├─ Tipo: {}", tipo);
        logger.info("├─ Servidor SMTP: {}", mailHost);
        logger.info("├─ JavaMailSender disponível? {}", mailSender != null ? "✅ SIM" : "❌ NÃO");
        logger.info("└─ Email habilitado? {}", !"localhost".equals(mailHost) ? "✅ SIM" : "❌ MODO DEV");
        logger.info("******************************************************************");
        
        // Se for localhost ou mailSender não disponível, apenas simula
        if (mailSender == null || "localhost".equals(mailHost)) {
            logger.warn("MODO DESENVOLVIMENTO - Email NÃO será enviado realmente");
            logger.warn("Destinatário: {}", destinatario);
            logger.warn("Assunto: {}", assunto);
            logger.warn("Corpo (primeira linha): {}", corpo.split("\n")[0]);
            
            // Ainda salva no banco para histórico
            Email emailEntity = new Email(destinatario, assunto, corpo, tipo);
            emailEntity.setStatus(StatusEmail.ENVIADO);
            emailEntity.setErro("MODO DEV - Email simulado");
            emailRepository.save(emailEntity);
            
            logger.info("Email salvo no banco (modo dev)");
            return;
        }
        
        Email emailEntity = new Email(destinatario, assunto, corpo, tipo);
        
        try {
            logger.info("Preparando mensagem de email...");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(destinatario);
            message.setSubject(assunto);
            message.setText(corpo);
            
            logger.info("Enviando email via SMTP...");
            mailSender.send(message);
            
            emailEntity.setStatus(StatusEmail.ENVIADO);
            logger.info("*****************************************");
            logger.info("EMAIL ENVIADO COM SUCESSO!");
            logger.info("Para: {}", destinatario);
            logger.info("Assunto: {}", assunto);
            logger.info("Hora: {}", timestamp);
            logger.info("******************************************");
            
        } catch (Exception e) {
            emailEntity.setStatus(StatusEmail.ERRO);
            emailEntity.setErro(e.getMessage());
            
            logger.error("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
            logger.error("x ERRO AO ENVIAR EMAIL!");
            logger.error("Destinatário: {}", destinatario);
            logger.error("Erro: {}", e.getMessage());
            logger.error("Classe do erro: {}", e.getClass().getName());
            
            if (e.getMessage().contains("535")) {
                logger.error("Problema de AUTENTICAÇÃO");
                logger.error("Verifique: 1) Senha de app do Gmail");
                logger.error("Verifique: 2) Verificação em 2 etapas ativada?");
            } else if (e.getMessage().contains("Could not connect")) {
                logger.error("Problema de CONEXÃO");
                logger.error("Verifique: 1) Configuração SMTP");
                logger.error("Verifique: 2) Firewall/portas abertas");
            }
            logger.error("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
            
        } finally {
            emailRepository.save(emailEntity);
            logger.info("Email salvo no banco com status: {}", emailEntity.getStatus());
        }
    }
    
    @Async("taskExecutor")
    public void notificarResponsavelTarefa(String emailResponsavel, String nomeResponsavel,
                                          String tituloTarefa, String descricaoTarefa,
                                          Date dataTermino, TaskStatus status) {
        
        logger.info("📋 ENVIANDO NOTIFICAÇÃO DE TAREFA PARA RESPONSÁVEL");
        logger.info("├─ Responsável: {} ({})", nomeResponsavel, emailResponsavel);
        logger.info("├─ Tarefa: {}", tituloTarefa);
        logger.info("└─ Status: {}", status);
        
        String assunto = "🎯 Nova Tarefa Atribuída - " + tituloTarefa;
        
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
        String dataTerminoStr = dataTermino != null ? sdf.format(dataTermino) : "Não definida";
        
        String corpo = String.format(
            "Olá %s,\n\n" +
            "Você foi designado(a) como responsável por uma nova tarefa.\n\n" +
            "📋 DETALHES DA TAREFA:\n" +
            "• Título: %s\n" +
            "• Descrição: %s\n" +
            "• Status: %s\n" +
            "• Prazo: %s\n\n" +
            "🔧 AÇÕES NECESSÁRIAS:\n" +
            "1. Acesse o Sistema Gestora\n" +
            "2. Verifique os detalhes da tarefa\n" +
            "3. Atualize o progresso conforme necessário\n\n" +
            "📞 PRECISA DE AJUDA?\n" +
            "Entre em contato com o administrador do sistema.\n\n" +
            "Atenciosamente,\n" +
            "Sistema de Gestão de Tarefas",
            nomeResponsavel, tituloTarefa, descricaoTarefa, 
            status.name(), dataTerminoStr
        );
        
        enviarEmail(emailResponsavel, assunto, corpo, "notificacao_tarefa");
    }
    
    // Método específico para boas-vindas com logs

    @Async("taskExecutor")
    public void enviarBoasVindasInicial(String emailUsuario, String nomeUsuario, String tmpPass) {
        logger.info("ENVIANDO EMAIL DE BOAS-VINDAS PARA O USUÁRIO");
        logger.info("Destinatário: {} ({})", nomeUsuario, emailUsuario);
        logger.info("Senha: {}", tmpPass);
        
        String assunto = "Bem-vindo ao Sistema Gestora!";
        String corpo = String.format(
            "Olá %s,\n\n" +
            "Seja muito bem-vindo(a) ao Sistema Gestora!\n\n" +
            "SUAS CREDENCIAIS DE ACESSO:\n" +
            "• Email: %s\n" +
            "• Senha: %s\n\n" +
            "RECOMENDAÇÕES:\n" +
            "1. Faça login com essas credenciais\n" +
            "2. Altere sua senha imediatamente\n\n" +
            "Atenciosamente,\nEquipe Gestora",
            nomeUsuario, emailUsuario, tmpPass
        );
        
        //Envia para o USUÁRIO, não para admin
        enviarEmail(emailUsuario, assunto, corpo, "boas_vindas_inicial");
    }

    @Async("taskExecutor")
    public void notificarAdminNovoUsuario(String nomeUsuario, String emailUsuario) {
        logger.info("NOTIFICANDO ADMIN SOBRE NOVO USUÁRIO");
        logger.info("Nome: {}", nomeUsuario);
        logger.info("Email do novo usuário: {}", emailUsuario);
        
        String assunto = "Novo Usuário Registrado - Sistema Gestora";
        String corpo = String.format(
            "Administrador,\n\n" +
            "Um novo usuário foi registrado no sistema:\n\n" +
            "• Nome: %s\n" +
            "• Email: %s\n" +
            "• Data: %s\n\n" +
            "Atenciosamente,\nSistema Gestora",
            nomeUsuario, emailUsuario, LocalDateTime.now()
        );
        
        //Envia para ADMIN (para notificação)
        enviarEmail(adminEmail, assunto, corpo, "notificacao_admin");
    }
    
    @Async("taskExecutor")
    public void enviarRecuperacaoSenha(String emailUsuario, String token) {
        logger.info("ENVIANDO EMAIL DE RECUPERAÇÃO DE SENHA");
        
        String assunto = "Recuperação de Senha - Sistema Gestora";
        String corpo = String.format(
            "Olá,\n\n" +
            "Você solicitou a recuperação de senha.\n" +
            "Use o seguinte token para redefinir sua senha:\n\n" +
            "Token: %s\n\n" +
            "Este token expira em 24 horas.\n\n" +
            "Atenciosamente,\nEquipe Gestora",
            token
        );
        
        enviarEmail(emailUsuario, assunto, corpo, "recuperacao_senha");
    }
    
    
    @Async("taskExecutor")
    public void notificarAdminErroSistema(String erro, String modulo) {
        logger.info("NOTIFICANDO ADMIN SOBRE ERRO NO SISTEMA");
        
        String assunto = "ERRO NO SISTEMA - " + modulo;
        String corpo = String.format(
            "Administrador,\n\n" +
            "Ocorreu um erro no sistema:\n\n" +
            "Módulo: %s\n" +
            "Erro: %s\n" +
            "Data: %s\n\n" +
            "Atenciosamente,\nSistema de Monitoramento",
            modulo, erro, LocalDateTime.now()
        );
        
        enviarEmail(adminEmail, assunto, corpo, "erro_sistema");
    }
    
    @Async("taskExecutor")
    public void notificarTodosAdmins(String assunto, String corpo) {
        logger.info("NOTIFICANDO TODOS OS ADMINS");
        
        List<String> emailsAdmins = List.of(adminEmail, systemEmail != null ? systemEmail : adminEmail);
        
        for (String email : emailsAdmins) {
            enviarEmail(email, assunto, corpo, "notificacao_todos_admins");
        }
    }
    
    // Métodos para consultas
    public List<Email> buscarEmailsPendentes() {
        return emailRepository.findByStatus(StatusEmail.PENDENTE);
    }
    
    public List<Email> buscarEmailsPorTipo(String tipo) {
        return emailRepository.findByTipo(tipo);
    }
    
    public long contarEmailsEnviados() {
        return emailRepository.countByStatus(StatusEmail.ENVIADO);
    }
    
    public List<Email> buscarEmailsPorDestinatario(String destinatario) {
        return emailRepository.findByDestinatario(destinatario);
    }
    
    // Método para reenviar emails com erro
    @Async("taskExecutor")
    public void reenviarEmail(Long emailId) {
        logger.info("TENTANDO REENVIAR EMAIL ID: {}", emailId);
        
        emailRepository.findById(emailId).ifPresent(email -> {
            if (email.getStatus() == StatusEmail.ERRO) {
                logger.info("Reenviando email para: {}", email.getDestinatario());
                enviarEmail(email.getDestinatario(), email.getAssunto(), email.getCorpo(), email.getTipo());
            }
        });
    }
}