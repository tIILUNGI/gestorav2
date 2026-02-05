package com.gestora.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress == null ? "" : fromAddress.trim();
    }

    public boolean sendInviteEmail(String to, String inviteLink) {
        if (fromAddress.isEmpty()) {
            logger.warn("Email não configurado. Link do convite: {}", inviteLink);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject("Convite para definir sua senha - GESTORA");
            message.setText("Olá,\n\nVocê foi convidado para acessar o sistema GESTORA.\n" +
                "Defina sua palavra-passe no link abaixo:\n\n" +
                inviteLink + "\n\n" +
                "Se você não solicitou este convite, ignore este email.\n");

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            logger.warn("Falha ao enviar email de convite para {}: {}", to, e.getMessage());
            logger.warn("Link do convite: {}", inviteLink);
            return false;
        }
    }

    public boolean sendTempCredentialsEmail(String to, String tempPassword) {
        if (fromAddress.isEmpty()) {
            logger.warn("Email não configurado. Credenciais temporárias para {}: {}", to, tempPassword);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject("Credenciais temporárias - GESTORA");
            message.setText("Olá,\n\nVocê foi cadastrado no sistema GESTORA.\n" +
                "Credenciais temporárias:\n" +
                "Email: " + to + "\n" +
                "Senha: " + tempPassword + "\n\n" +
                "Após o login, será solicitado que você altere a senha.\n");

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            logger.warn("Falha ao enviar credenciais para {}: {}", to, e.getMessage());
            logger.warn("Senha temporária: {}", tempPassword);
            return false;
        }
    }
}
