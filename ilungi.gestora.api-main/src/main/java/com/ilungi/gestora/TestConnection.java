package com.ilungi.gestora;
import java.sql.Connection;
import java.sql.DriverManager;

public class TestConnection {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/gestora_db";
        String user = "postgres";
        String password = "111126";
        
        try {
            System.out.println("Testando conexão com PostgreSQL...");
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("CONEXÃO BEM-SUCEDIDA!");
            System.out.println("Banco: " + conn.getMetaData().getDatabaseProductName());
            System.out.println("Versão: " + conn.getMetaData().getDatabaseProductVersion());
            conn.close();
        } catch (Exception e) {
            System.err.println("ERRO NA CONEXÃO:");
            System.err.println("Mensagem: " + e.getMessage());
            System.err.println("Verifique:");
            System.err.println("1. PostgreSQL está rodando?");
            System.err.println("2. Banco 'gestora_db' existe?");
            System.err.println("3. Usuário/senha corretos?");
        }
    }
}