# Build stage
FROM gradle:8.14-jdk21-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração
COPY build.gradle.kts settings.gradle.kts ./

# Download de dependências primeiro
RUN gradle dependencies --no-daemon || true

# Copiar código fonte
COPY src ./src

# Build da aplicação
RUN gradle clean build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]