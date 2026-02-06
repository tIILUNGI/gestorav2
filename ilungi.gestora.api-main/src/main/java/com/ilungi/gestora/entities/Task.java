package com.ilungi.gestora.entities;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

@Entity
@Table(name="tb_tasks")
public class Task implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    
    @Temporal(TemporalType.TIMESTAMP) 
    private Date createAt;
    
    @Temporal(TemporalType.TIMESTAMP) 
    private Date endDate;
    
    private Integer daysToFinish;
    
    @Enumerated(EnumType.STRING)
    private TaskStatus status;
    
    // CORRETO: Esta é a propriedade que o mappedBy referencia
    @ManyToMany
    @JoinTable(
        name = "task_responsibles",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnoreProperties({"assignedTasks", "createdTasks", "password"})
    private List<User> responsibles = new ArrayList<>(); 
    
    @ManyToOne
    @JoinColumn(name = "created_by_id")
    @JsonIgnoreProperties({"assignedTasks", "createdTasks", "password"})
    private User createdBy;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Date getCreateAt() {
		return createAt;
	}

	public void setCreateAt(Date createAt) {
		this.createAt = createAt;
	}

	public Date getEndDate() {
		return endDate;
	}

	public void setEndDate(Date endDate) {
		this.endDate = endDate;
	}

	public Integer getDaysToFinish() {
		return daysToFinish;
	}

	public void setDaysToFinish(Integer daysToFinish) {
		this.daysToFinish = daysToFinish;
	}

	public TaskStatus getStatus() {
		return status;
	}

	public void setStatus(TaskStatus status) {
		this.status = status;
	}

	public List<User> getResponsibles() {
		return responsibles;
	}

	public void setResponsibles(List<User> responsibles) {
		this.responsibles = responsibles;
	}

	public User getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(User createdBy) {
		this.createdBy = createdBy;
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Task other = (Task) obj;
		return Objects.equals(id, other.id);
	}
    
    
    
  
}