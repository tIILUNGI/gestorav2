# 🚀 GESTORA v2.0 - Guia de Implantação e Testes de Carga

## 📋 Checklist de Pré-Implantação

### ✅ Estrutura Verificada
- [x] Backend única instância: `gestora-backend/`
- [x] Frontend pronto: TypeScript + React
- [x] API Service: `services/apiService.ts`
- [x] Configurações centralizadas
- [x] Variáveis de ambiente prontas

### ✅ Componentes de Sistema

#### Frontend (TypeScript/React/Vite)
- Aplicação React 19.2.3
- TypeScript 5.8.2
- Tailwind CSS para UI
- Lucide React para ícones
- Google Generative AI integrado

#### Backend (Spring Boot 2.7.14)
- Spring Boot com Spring Data JPA
- MySQL 8.0+
- Spring Security + JWT
- REST API com 30+ endpoints
- Suporte a transações e caching

---

## 🏗️ Arquitetura do Sistema

```
GESTORA v2.0
├── Frontend (React/TypeScript)
│   ├── App.tsx (1017 linhas)
│   ├── services/
│   │   ├── apiService.ts (284 linhas)
│   │   └── geminiService.ts
│   └── vite.config.ts
│
├── Backend (Spring Boot)
│   ├── Controllers (4)
│   │   ├── AuthController
│   │   ├── TaskController
│   │   ├── CommentController
│   │   └── UserController
│   ├── Services (3)
│   ├── Repositories (3)
│   ├── Models (3)
│   └── Security (5)
│
└── Database (MySQL)
    ├── Users
    ├── Tasks
    └── Comments
```

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Java 11+
- Maven 3.6+
- MySQL 8.0+
- Node.js 18+
- npm ou yarn

### 1️⃣ Configurar Database MySQL

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar database
CREATE DATABASE gestora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (opcional)
CREATE USER 'gestora'@'localhost' IDENTIFIED BY 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON gestora_db.* TO 'gestora'@'localhost';
FLUSH PRIVILEGES;
```

### 2️⃣ Configurar Backend

```bash
cd gestora-backend

# Editar variáveis de ambiente
cp .env.example .env.local

# Opções de configuração:
# Desenvolvimento: .env.local
# Produção: .env.production

# Compilar
mvn clean install

# Executar
mvn spring-boot:run

# Ou com profile específico:
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

### 3️⃣ Configurar Frontend

```bash
cd ..

# Instalar dependências
npm install

# Configurar variáveis
echo "VITE_API_BASE_URL=https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app" > .env.production

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview
npm run preview
```

---

## 🔐 Segurança e Configuração

### JWT Token
- **Expiração**: 24 horas (86400000 ms)
- **Algoritmo**: HS512
- **Chave Mínima**: 32 caracteres

### CORS e Headers
- Backend suporta CORS configurável
- Bearer token em `Authorization` header
- Content-Type: `application/json`

### Variáveis Críticas para Produção

```env
# Database
SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/gestora_db
SPRING_DATASOURCE_USERNAME=gestora
SPRING_DATASOURCE_PASSWORD=SENHA_MUITO_SEGURA

# JWT
JWT_SECRET=uma_chave_secreta_muito_longa_min_32_caracteres_123456
JWT_EXPIRATION=86400000

# Server
SERVER_PORT=8080
SERVER_TOMCAT_MAX_THREADS=200

# Logging
LOGGING_LEVEL_COM_GESTORA=INFO
```

---

## 📊 Testes de Carga

### Ferramentas Recomendadas
1. **Apache JMeter**: Teste distribuído
2. **Locust**: Python-based
3. **k6**: JavaScript/Go

### Plano de Teste

```
Fase 1: Carga Baixa
- 10 usuários simultâneos
- Duração: 2 minutos
- Ramp-up: 1 minuto

Fase 2: Carga Média
- 50 usuários simultâneos
- Duração: 5 minutos
- Ramp-up: 2 minutos

Fase 3: Carga Alta
- 100 usuários simultâneos
- Duração: 10 minutos
- Ramp-up: 3 minutos

Fase 4: Pico
- 200 usuários simultâneos
- Duração: 5 minutos
- Ramp-up: 1 minuto
```

### Script de Teste com curl

```bash
#!/bin/bash
API_URL="https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app"

# Login
TOKEN=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gestora.com","password":"admin123"}' \
  | jq -r '.token')

# Listar tarefas
curl -X GET $API_URL/tasks \
  -H "Authorization: Bearer $TOKEN"

# Criar tarefa (teste de carga)
for i in {1..100}; do
  curl -X POST $API_URL/tasks \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Task $i\",\"description\":\"Test task $i\"}"
done
```

---

## 🐛 Troubleshooting

### Backend não conecta ao MySQL
```bash
# Verificar conexão
mysql -h localhost -u root -p -e "SELECT VERSION();"

# Verificar porta MySQL (padrão: 3306)
netstat -an | grep 3306
```

### Frontend não encontra API
- Verificar `VITE_API_BASE_URL` em `.env`
- Testar URL diretamente: `curl https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app/api/tasks`
- Verificar CORS headers no backend

### JWT Token expirado
- Token tem 24h de validade
- Implementar refresh token (TODO)
- Usuário deve fazer login novamente

### Performance ruim
- Aumentar `SERVER_TOMCAT_MAX_THREADS`
- Verificar índices MySQL
- Otimizar queries N+1

---

## 📈 Métricas Esperadas

### Backend (Spring Boot)
- **Throughput**: 200+ requisições/segundo
- **Latência P95**: < 100ms
- **Memória**: ~512MB base
- **CPU**: < 50% em carga normal

### Frontend (Vite)
- **Bundle Size**: < 500KB gzipped
- **Tempo de Carregamento**: < 2s
- **Lighthouse**: 90+ (Performance)

### Database (MySQL)
- **Connection Pool**: 5-20 conexões ativas
- **Query Time**: < 100ms (P95)
- **Storage**: ~100MB para dados de teste

---

## 🚀 Implantação em Produção

### Deployment em Railway.app (Recomendado)

```bash
# 1. Fazer commit e push
git add .
git commit -m "Pronto para produção"
git push origin main

# 2. Conectar no Railway.app
# railway link

# 3. Deployar
# railway up
```

### Docker (Opcional)

```dockerfile
FROM openjdk:11-jre-slim
COPY gestora-backend/target/*.jar app.jar
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Variáveis de Produção Railway

```
SPRING_DATASOURCE_URL=jdbc:mysql://proddb:3306/gestora_db
SPRING_DATASOURCE_USERNAME=gestora_prod
JWT_SECRET=<gerar com: openssl rand -base64 32>
LOGGING_LEVEL_COM_GESTORA=INFO
```

---

## ✅ Checklist de Implantação

- [ ] Database MySQL criada e acessível
- [ ] Backend compilado com sucesso
- [ ] Frontend build criado (dist/)
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET com 32+ caracteres
- [ ] CORS configurado
- [ ] SSL/HTTPS habilitado
- [ ] Backups automatizados configurados
- [ ] Logs centralizados
- [ ] Monitoramento ativo
- [ ] Testes de carga executados
- [ ] Plano de rollback preparado

---

## 📞 Suporte e Documentação

- **API Docs**: `https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app/api/swagger-ui.html` (TODO)
- **Logs**: `/logs/gestora-backend.log`
- **Status**: Verificar `systemActivities` no frontend

---

**Versão**: 2.0.0  
**Data**: 2026-02-03  
**Status**: ✅ Pronto para Implantação
