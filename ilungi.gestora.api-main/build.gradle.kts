plugins {
    java
    id("org.springframework.boot") version "4.0.2"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.ilungi"
version = "1.0.0"
description = "Gestora API - Sistema de gestão de tarefas"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25) 
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    
    //email
    implementation ("org.springframework.boot:spring-boot-starter-mail")
    implementation ("com.sun.mail:jakarta.mail:2.0.1")
    
    
    // Banco de Dados
    runtimeOnly("com.h2database:h2")
    runtimeOnly("org.postgresql:postgresql")
    
    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")
    
    // Swagger/OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")
    
    // Actuator (para health checks no Docker/Render)
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    
    // Testes
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// ========== CONFIGURAÇÕES DO JAR ==========
// APENAS UMA configuração bootJar
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("app.jar")  // Nome fixo
    manifest {
        attributes(
            "Implementation-Title" to "Gestora API",
            "Implementation-Version" to version,
            "Main-Class" to "org.springframework.boot.loader.launch.JarLauncher",
            "Start-Class" to "com.ilungi.gestora.Application"
        )
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

// Desabilitar jar normal (não-executável)
tasks.named<Jar>("jar") {
    enabled = false
    archiveClassifier.set("plain")
}

// ========== CONFIGURAÇÕES DE TESTES ==========
tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
    }
}

// ========== CONFIGURAÇÕES DE COMPILAÇÃO ==========
tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
    options.encoding = "UTF-8"
}

// ========== TAREFAS DOCKER PERSONALIZADAS ==========
tasks.register<Exec>("buildDockerImage") {
    dependsOn(tasks.bootJar)
    commandLine("docker", "build", "-t", "gestora-api:latest", ".")
}

tasks.register<Exec>("dockerComposeUp") {
    commandLine("docker-compose", "up", "--build", "-d")
}

tasks.register<Exec>("dockerComposeDown") {
    commandLine("docker-compose", "down", "-v")
}

tasks.register<Exec>("dockerComposeLogs") {
    commandLine("docker-compose", "logs", "-f")
}

// ========== TAREFA PARA LIMPEZA ==========
tasks.register<Delete>("cleanAll") {
    delete("build", "out", ".gradle")
    dependsOn(tasks.clean)
}