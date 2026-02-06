package com.ilungi.gestora.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
	private String secret = "ilungi-key-private-gestora2026110211";
	private Long expiration = 8640000L;
	public String getSecret() {
		return secret;
	}
	public void setSecret(String secret) {
		this.secret = secret;
	}
	public Long getExpiration() {
		return expiration;
	}
	public void setExpiration(Long experation) {
		this.expiration = experation;
	}
	
	
}
