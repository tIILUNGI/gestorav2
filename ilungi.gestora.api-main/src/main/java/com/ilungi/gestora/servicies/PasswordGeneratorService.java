package com.ilungi.gestora.servicies;

import org.springframework.stereotype.Component;
import java.security.SecureRandom;

@Component
public class PasswordGeneratorService {
    
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%&*()_+-=[]|,./?><";
    
    private final SecureRandom random = new SecureRandom();
    
    /**
     * Gera senha para novos usuários (padrão)
     */
    public String generateUserPassword() {
        // Padrão: 8 caracteres alfanuméricos
        return generatePassword(8, true, true, true, false);
    }
    
    /**
     * Gera senha forte para admins
     */
    public String generateAdminPassword() {
        // 12 caracteres com símbolos
        return generatePassword(12, true, true, true, true);
    }
    
    /**
     * Gera senha temporária simples
     */
    public String generateTemporaryPassword() {
        // 6 caracteres apenas números (para SMS/WhatsApp)
        return generateNumericPassword(6);
    }
    
    /**
     * Método flexível para gerar senhas
     */
    public String generatePassword(int length, boolean useUpper, boolean useLower, 
                                  boolean useDigits, boolean useSpecial) {
        
        if (length < 4) length = 4;
        
        StringBuilder charPool = new StringBuilder();
        if (useUpper) charPool.append(UPPERCASE);
        if (useLower) charPool.append(LOWERCASE);
        if (useDigits) charPool.append(DIGITS);
        if (useSpecial) charPool.append(SPECIAL);
        
        if (charPool.length() == 0) {
            throw new IllegalArgumentException("Selecione pelo menos um tipo de caractere");
        }
        
        StringBuilder password = new StringBuilder(length);
        
        // Garante pelo menos um de cada tipo selecionado
        if (useUpper) {
            password.append(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        }
        if (useLower) {
            password.append(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        }
        if (useDigits) {
            password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        }
        if (useSpecial) {
            password.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));
        }
        
        // Preenche o resto
        for (int i = password.length(); i < length; i++) {
            password.append(charPool.charAt(random.nextInt(charPool.length())));
        }
        
        // Embaralha
        return shuffle(password.toString());
    }
    
    /**
     * Gera senha apenas numérica
     */
    public String generateNumericPassword(int length) {
        StringBuilder password = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        }
        return password.toString();
    }
    
    /**
     * Gera senha baseada em palavras (fácil de lembrar)
     */
    public String generateMemorablePassword(int wordCount) {
        String[] words = {
            "sol", "lua", "mar", "rio", "ceu", "vento", "fogo", "terra", "agua",
            "verde", "azul", "vermelho", "amarelo", "branco", "preto",
            "gato", "cao", "pato", "pavao", "leao", "tigre",
            "livro", "casa", "porta", "janela", "mesa", "cadeira"
        };
        
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < wordCount; i++) {
            if (i > 0) {
                password.append(random.nextInt(10)); // Adiciona número entre palavras
            }
            password.append(words[random.nextInt(words.length)]);
        }
        
        // Capitaliza a primeira letra
        if (password.length() > 0) {
            password.setCharAt(0, Character.toUpperCase(password.charAt(0)));
        }
        
        return password.toString();
    }
    
    /**
     * Avalia força da senha
     */
    public String evaluatePasswordStrength(String password) {
        if (password == null || password.length() < 4) {
            return "MUITO FRACA";
        }
        
        int score = 0;
        
        // Comprimento
        if (password.length() >= 8) score++;
        if (password.length() >= 12) score++;
        
        // Tipos de caracteres
        if (password.matches(".*[A-Z].*")) score++; 
        if (password.matches(".*[a-z].*")) score++; 
        if (password.matches(".*\\d.*")) score++;   
        if (password.matches(".*[!@#$%&*()_+\\-=\\[\\]{}|,./?><].*")) score++; 
        
        if (score >= 6) return "MUITO FORTE";
        if (score >= 4) return "FORTE";
        if (score >= 3) return "MODERADA";
        return "FRACA";
    }
    
    private String shuffle(String input) {
        char[] chars = input.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}