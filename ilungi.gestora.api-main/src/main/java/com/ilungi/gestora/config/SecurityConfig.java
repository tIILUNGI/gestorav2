package com.ilungi.gestora.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ⭐ HABILITA CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Desabilita CSRF para APIs stateless
            .csrf(AbstractHttpConfigurer::disable)
            
            // Configura sessão stateless
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Configura autorização de requests
            .authorizeHttpRequests(authz -> authz
                // ⭐⭐ CRÍTICO: Permite OPTIONS para CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // H2 Console
                .requestMatchers("/h2-console/**").permitAll()
                
                // Recursos estáticos
                .requestMatchers("/*.css").permitAll()
                .requestMatchers("/*.js").permitAll()
                .requestMatchers("/*.gif").permitAll()
                .requestMatchers("/*.jpg").permitAll()
                .requestMatchers("/*.png").permitAll()
                .requestMatchers("/*.ico").permitAll()
                
                // Rotas públicas da API
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/favicon.ico").permitAll()
                
                // Actuator (monitoramento)
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/actuator").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/health/**").permitAll()
                
                // Swagger/OpenAPI
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Admin routes
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/tasks/admin/**").hasRole("ADMIN")
                .requestMatchers("/users/admin/**").hasRole("ADMIN")
                
                // Rotas autenticadas
                .requestMatchers("/tasks/**").authenticated()
                .requestMatchers("/users/**").authenticated()
                .requestMatchers("/api/**").authenticated()
                
                // Qualquer outra rota - autenticada
                .anyRequest().authenticated()
            )
            
            // Configura headers
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin()) // Permite iframes do mesmo origin
                .contentTypeOptions(HeadersConfigurer.ContentTypeOptionsConfig::disable)
            )
            
            // Adiciona filtro JWT
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    // ⭐ CONFIGURAÇÃO CORS PARA SPRING SECURITY
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Origens permitidas
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",      // Vite/React dev
            "http://localhost:3000",      // Create React App dev
            "http://localhost:4200",      // Angular dev
            "https://ilungigestoraapi-production-2cfa.up.railway.app" ,// Sua API
            "https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app",// Sua API
            "https://ilungi-gestora-api-oox9.onrender.com" 
        ));
        
        // Métodos permitidos
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
        ));
        
        // Headers permitidos
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        
        // Headers expostos
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Disposition"
        ));
        
        // Permite credentials (cookies, auth headers)
        configuration.setAllowCredentials(true);
        
        // Cache de preflight (1 hora)
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

/**
*
*   

.anyRequest().authenticated()*/