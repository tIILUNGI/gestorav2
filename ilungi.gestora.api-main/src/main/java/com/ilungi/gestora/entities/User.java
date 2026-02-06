package com.ilungi.gestora.entities;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "users")
public class User implements UserDetails{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    @JsonIgnore
    private String password;
    
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // CORREÇÃO: mappedBy deve apontar para "responsibles" (plural)
    @ManyToMany(mappedBy = "responsibles")  // <- AQUI ESTÁ O ERRO
    @JsonIgnoreProperties({"responsibles", "createdBy"})
    private List<Task> assignedTasks = new ArrayList<>();
    
    // Tarefas criadas pelo usuário
    @OneToMany(mappedBy = "createdBy")
    @JsonIgnoreProperties({"createdBy", "responsibles"})
    private List<Task> createdTasks = new ArrayList<>();
    
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }


    @Override
    public String getUsername() {
        // ✅ Usamos email como username
        return this.email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true; // Conta não expirada
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true; // Conta não bloqueada
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true; // Conta ativa
    }
    
    // Construtores
    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public User(String name, String email, String password, String phone, Role role) {
        this();
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
    }
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<Task> getAssignedTasks() { return assignedTasks; }
    public void setAssignedTasks(List<Task> assignedTasks) { this.assignedTasks = assignedTasks; }
    
    public List<Task> getCreatedTasks() { return createdTasks; }
    public void setCreatedTasks(List<Task> createdTasks) { this.createdTasks = createdTasks; }
    
    // Métodos utilitários
    public void addAssignedTask(Task task) {
        if (this.assignedTasks == null) {
            this.assignedTasks = new ArrayList<>();
        }
        if (!this.assignedTasks.contains(task)) {
            this.assignedTasks.add(task);
        }
    }
    
    public void removeAssignedTask(Task task) {
        if (this.assignedTasks != null) {
            this.assignedTasks.remove(task);
        }
    }
}