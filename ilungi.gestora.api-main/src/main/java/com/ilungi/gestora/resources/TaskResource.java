package com.ilungi.gestora.resources;


import com.fasterxml.jackson.databind.JsonNode;
import com.ilungi.gestora.entities.Role;
import com.ilungi.gestora.entities.Task;
import com.ilungi.gestora.entities.TaskStatus;
import com.ilungi.gestora.entities.User;
import com.ilungi.gestora.servicies.TaskService;
import com.ilungi.gestora.servicies.UserService;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;


@RestController
@RequestMapping("/tasks")
@Tag(name = "Tasks", description = "Operações relacionadas a tarefas")
public class TaskResource {
    
    @Autowired
    private TaskService taskService;
    
    @Autowired
    private UserService userService;
    

    @GetMapping
    public ResponseEntity<List<Task>> findAll() {
        List<Task> list = taskService.findAll();
        return ResponseEntity.ok(list);
    }
    
    //USER vê apenas suas tasks
    @GetMapping("/my-tasks")
    public ResponseEntity<List<Task>> findMyTasks() {
        List<Task> list = taskService.findMyTasks();
        return ResponseEntity.ok(list);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Task> findById(@PathVariable Long id) {
        Task obj = taskService.findById(id);
        return ResponseEntity.ok(obj);
    }
    
    //ADMIN pode ver todas sem filtro
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")  // Só ADMIN
    public ResponseEntity<List<Task>> findAllAdmin() {
        List<Task> list = taskService.findAllTasksAdmin();
        return ResponseEntity.ok(list);
    }
 
    //Criar task (USER cria para si, ADMIN para qualquer um)
   /* @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task newTask = taskService.createTask(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(newTask);
    }*/
    
    //Atualizar task (USER só status, ADMIN tudo)
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task task) {
        Task updatedTask = taskService.updateTask(id, task);
        return ResponseEntity.ok(updatedTask);
    }
    
    //Especial: USER atualiza apenas status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> json) {
        TaskStatus status = TaskStatus.valueOf(json.get("status").toUpperCase());
        Task updatedTask = taskService.updateMyTaskStatus(id, status);
        return ResponseEntity.ok(updatedTask);
    }
    
    
    /*//Deletar (USER só suas, ADMIN qualquer)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }*/
    
    //Endpoint para USER ver estatísticas próprias
    @GetMapping("/my-stats")
    public ResponseEntity<Map<String, Object>> getMyStats() {
        List<Task> myTasks = taskService.findMyTasks();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", myTasks.size());
        stats.put("pending", myTasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count());
        stats.put("doing", myTasks.stream().filter(t -> t.getStatus() == TaskStatus.DOING).count());
        stats.put("done", myTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count());
        
        return ResponseEntity.ok(stats);
    }
    
    
}