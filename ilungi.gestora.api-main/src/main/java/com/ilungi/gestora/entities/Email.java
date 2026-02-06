package com.ilungi.gestora.entities;

import java.time.LocalDateTime;

import jakarta.persistence.*;


@Entity
@Table(name = "emais")
public class Email {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	 @Column(nullable = false)
	 private String destinatario;
	    
	 @Column(nullable = false)
	 private String assunto;
	    
	  @Column(columnDefinition = "TEXT", nullable = false)
	  private String corpo;
	    
	  @Enumerated(EnumType.STRING)
	  @Column(nullable = false)
	  private StatusEmail status;
	    
	   @Column(nullable = false)
	   private LocalDateTime dataEnvio;
	    
	   private String erro;
	    
	   @Column(nullable = false)
	   private String tipo;
	
	   
	   public Email() {
	        this.dataEnvio = LocalDateTime.now();
	        this.status = StatusEmail.PENDENTE;
	    }
	    
	   public Email(String destinatario, String assunto, String corpo, String tipo) {
	        this();
	        this.destinatario = destinatario;
	        this.assunto = assunto;
	        this.corpo = corpo;
	        this.tipo = tipo;
	    }

	   public Long getId() {
		   return id;
	   }

	   public void setId(Long id) {
		   this.id = id;
	   }

	   public String getDestinatario() {
		   return destinatario;
	   }

	   public void setDestinatario(String destinatario) {
		   this.destinatario = destinatario;
	   }

	   public String getAssunto() {
		   return assunto;
	   }

	   public void setAssunto(String assunto) {
		   this.assunto = assunto;
	   }

	   public String getCorpo() {
		   return corpo;
	   }

	   public void setCorpo(String corpo) {
		   this.corpo = corpo;
	   }

	   public StatusEmail getStatus() {
		   return status;
	   }

	   public void setStatus(StatusEmail status) {
		   this.status = status;
	   }

	   public LocalDateTime getDataEnvio() {
		   return dataEnvio;
	   }

	   public void setDataEnvio(LocalDateTime dataEnvio) {
		   this.dataEnvio = dataEnvio;
	   }

	   public String getErro() {
		   return erro;
	   }

	   public void setErro(String erro) {
		   this.erro = erro;
	   }

	   public String getTipo() {
		   return tipo;
	   }

	   public void setTipo(String tipo) {
		   this.tipo = tipo;
	   }
	    
	   
}
