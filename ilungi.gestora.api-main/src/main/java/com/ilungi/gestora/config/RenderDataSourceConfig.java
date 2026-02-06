
package com.ilungi.gestora.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

@Configuration
public class RenderDataSourceConfig {
    
    @Bean
    @Profile("render")
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new RuntimeException("DATABASE_URL não configurada no Render!");
        }
        
        return DataSourceBuilder.create()
            .url(databaseUrl)
            .driverClassName("org.postgresql.Driver")
            .build();
    }
}