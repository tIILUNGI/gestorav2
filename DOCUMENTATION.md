# GESTORA Pro - Documentação Técnica

## 1. ESTRUTURA DO PROJETO

```
gestoraPro/
├── frontend/                    # React + TypeScript
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/              # Páginas da aplicação
│   │   ├── services/           # Serviços de API
│   │   ├── hooks/              # Hooks personalizados
│   │   ├── utils/              # Funções utilitárias
│   │   ├── types/              # Tipos TypeScript
│   │   └── App.tsx             # Componente principal
│   └── index.html
│
├── gestora-backend/            # Backend Maven (Spring Boot 4.x)
│   └── src/main/java/com/gestora/
│       ├── config/             # Configurações (Security, JWT)
│       ├── controller/         # Controladores REST
│       ├── dto/                # Data Transfer Objects
│       ├── model/              # Entidades JPA
│       ├── repository/         # Repositórios JPA
│       ├── security/           # Segurança
│       └── service/            # Serviços de negócio
│
└── ilungi.gestora.api/        # Backend Gradle (alternativo)
    └── src/main/java/com/ilungi/gestora/
        ├── config/             # Configurações
        ├── resources/          # Controllers REST
        ├── entities/           # Entidades
        ├── repositories/       # Repositórios
        └── servicies/          # Serviços
```

---

## 2. AUTENTICAÇÃO

### 2.1 Fluxo de Login
```
1. Usuário acessa /login
2. Insere email + senha
3. Frontend → POST /auth/login
4. Backend valida credenciais
5. Retorna JWT token
6. Frontend armazena no sessionStorage
7. Redireciona para /dashboard
```

### 2.2 Primeira Senha Obrigatória
```
1. Usuário faz login com senha temporária
2. Backend verifica mustChangePassword = true
3. Frontend redireciona para /change-password
4. Usuário define nova senha
5. Backend atualiza mustChangePassword = false
6. Usuário acessa o sistema normalmente
```

### 2.3 Recuperação de Senha
```
1. Usuário acessa /forgot-password
2. Insere email
3. Frontend → POST /auth/forgot-password
4. Backend gera token de recuperação
5. Backend envia email com link
6. Usuário clica no link (/reset-password?token=xxx)
7. Usuário define nova senha
8. Backend valida token e atualiza senha
```

---

## 3. ROTAS DA API

### 3.1 Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login com email/senha |
| POST | `/api/auth/register` | Registo de novo utilizador |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Obter utilizador atual |
| POST | `/api/auth/forgot-password` | Solicitar recuperação |
| POST | `/api/auth/reset-password` | Resetar senha com token |

### 3.2 Utilizadores (Admin)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/users` | Listar todos os utilizadores |
| POST | `/api/admin/users` | Criar novo utilizador |
| GET | `/api/admin/users/{id}` | Obter utilizador por ID |
| PUT | `/api/admin/users/{id}` | Atualizar utilizador |
| DELETE | `/api/admin/users/{id}` | Eliminar utilizador |
| PATCH | `/api/admin/users/{id}/role` | Alterar função |

### 3.3 Tarefas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tasks` | Listar todas as tarefas |
| POST | `/api/tasks` | Criar nova tarefa |
| GET | `/api/tasks/{id}` | Obter tarefa por ID |
| PUT | `/api/tasks/{id}` | Atualizar tarefa |
| DELETE | `/api/tasks/{id}` | Eliminar tarefa |
| PATCH | `/api/tasks/{id}/status` | Alterar status |
| GET | `/api/tasks/my-tasks` | Minhas tarefas |

---

## 4. MODELO DE DADOS

### 4.1 Utilizador (User)
```json
{
  "id": "Long",
  "name": "String",
  "email": "String (único)",
  "password": "String (encriptada)",
  "phone": "String",
  "position": "String",
  "role": "ADMIN | USER",
  "mustChangePassword": "boolean",
  "createdAt": "LocalDateTime",
  "updatedAt": "LocalDateTime"
}
```

### 4.2 Tarefa (Task)
```json
{
  "id": "Long",
  "title": "String",
  "description": "String",
  "status": "PENDING | DOING | DONE | HOLD",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "responsibleId": "Long",
  "responsibleName": "String",
  "intervenientes": ["Long"],
  "deliveryDate": "LocalDateTime",
  "startDate": "LocalDateTime",
  "createdAt": "LocalDateTime",
  "updatedAt": "LocalDateTime"
}
```

---

## 5. PERMISSÕES

| Funcionalidade | ADMIN | USER |
|----------------|-------|------|
| Ver dashboard | ✅ | ✅ |
| Criar tarefas | ✅ | ✅ |
| Editar tarefas próprias | ✅ | ✅ |
| Editar todas as tarefas | ✅ | ❌ |
| Eliminar tarefas próprias | ✅ | ✅ |
| Eliminar todas as tarefas | ✅ | ❌ |
| Gerir utilizadores | ✅ | ❌ |
| Ver estatísticas | ✅ | ✅ |

---

## 6. FUNCIONAMENTO OFFLINE

### 6.1 Estrategia
- **Read-only offline:** Visualização de tarefas/notificações
- **Write online-only:** Criar/editar tarefas (sincroniza ao reconectar)

### 6.2 Storage
```javascript
// sessionStorage - Dados sensíveis
sessionStorage.setItem('gestora_token', token)

// localStorage - Dados não-sensíveis
localStorage.setItem('gestora_users', JSON.stringify(users))
localStorage.setItem('gestora_tasks', JSON.stringify(tasks))
localStorage.setItem('gestora_notifications', JSON.stringify(notifications))
```

---

## 7. LOGS E MONITORAMENTO

### 7.1 Tipos de Log
- `LOGIN_SUCCESS` - Login bem-sucedido
- `LOGIN_FAILED` - Falha no login
- `LOGOUT` - Logout
- `TASK_CREATED` - Tarefa criada
- `TASK_UPDATED` - Tarefa atualizada
- `TASK_DELETED` - Tarefa eliminada
- `USER_CREATED` - Utilizador criado
- `USER_DELETED` - Utilizador eliminado
- `PASSWORD_CHANGED` - Senha alterada
- `UNAUTHORIZED_ACCESS` - Acesso não autorizado

---

## 8. DASHBOARD

### 8.1 Estatísticas
- Total de tarefas
- Tarefas por status
- Tarefas por prioridade
- Tarefas atrasadas
- Atividades recentes

### 8.2 Gráficos
- Tarefas por mês
- Tarefas por responsável
- Tarefas por status (pizza)
- Atividades por dia

---

## 9. NOTIFICAÇÕES

### 9.1 Tipos
- `TASK_ASSIGNED` - Nova tarefa atribuída
- `TASK_UPDATED` - Tarefa atualizada
- `TASK_COMPLETED` - Tarefa concluída
- `COMMENT_ADDED` - Novo comentário
- `USER_INVITED` - Novo utilizador convidado
- `SYSTEM` - Mensagem do sistema

---

## 10. SEGURANÇA

### 10.1 JWT
- Token expira em 24h
- Refresh token disponível
- Senha encriptada com BCrypt

### 10.2 Proteção de Rotas
- Todas as rotas exceto `/login` e `/register` requerem autenticação
- Verificação de role em rotas administrativas

---

## 11. CONFIGURAÇÃO LOCAL

### 11.1 Backend (ilungi.gestora.api)
```bash
cd ilungi.gestora.api
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
```
- Porta: 8080
- Banco: H2 (em memória)
- URL: http://localhost:8080

### 11.2 Frontend
```bash
npm run dev
```
- Porta: 5173
- URL: http://localhost:5173

---

## 12. DADOS DE TESTE

| Email | Senha | Role |
|-------|-------|------|
| admin@gestora.com | admin123 | ADMIN |
| teste@gestora.com | teste123 | USER |

---

*Documento gerado automaticamente*
*Última atualização: 2026-02-05*
