# Gestora - Sistema de Gestão de Tarefas

Sistema completo de gestão de tarefas com interface moderna, notificações inteligentes e preparado para integração com backend Java.

---

## 🔥 Implementação do Backend Java

### **📚 Documentação Completa Disponível**

Todo o sistema está pronto para integração com API Java. Siga os guias abaixo:

| 🚀 | Documento | Descrição | Tempo |
|----|-----------|-----------|-------|
| **⭐** | **[QUICK_START.md](./QUICK_START.md)** | **Início rápido em 3 passos** | **30 min** |
| 📋 | [CHECKLIST.md](./CHECKLIST.md) | Checklist completo de implementação | 15-20h |
| 🛠️ | [BACKEND_JAVA_SETUP.md](./BACKEND_JAVA_SETUP.md) | Guia detalhado com estrutura completa | Referência |
| 💻 | [BACKEND_EXAMPLES.md](./BACKEND_EXAMPLES.md) | Exemplos prontos de código Java | Copiar/Colar |
| 🌐 | [API_INTEGRATION.md](./API_INTEGRATION.md) | Especificações completas da API | Referência |
| 📖 | [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) | Resumo da integração frontend ↔ backend | Visão geral |
| ⚙️ | [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md) | Configuração de variáveis de ambiente | 5 min |

### **⚡ Como Começar:**

```bash
# 1. Configure o arquivo .env
PUBLIC_API_BASE_URL=http://localhost:8080/api
PUBLIC_WS_URL=ws://localhost:8080/ws

# 2. Implemente o backend Java seguindo BACKEND_JAVA_SETUP.md

# 3. O frontend já está 100% pronto! Basta iniciar:
npm run dev
```

### **✅ O que está incluído:**
- ✅ Cliente HTTP completo (`src/lib/api-client.ts`)
- ✅ Tipos TypeScript para todas as requisições/respostas
- ✅ Adaptadores de dados frontend ↔ backend
- ✅ Autenticação JWT implementada
- ✅ WebSocket para notificações em tempo real
- ✅ Tratamento robusto de erros
- ✅ Exemplos completos de código Java (entidades, services, controllers)

**👉 Comece por: [QUICK_START.md](./QUICK_START.md) para ter o backend rodando em 30 minutos!**

---

---

## ✨ Funcionalidades

### 🎯 **Gestão de Tarefas**
- ✅ Criar, editar e eliminar tarefas
- ✅ Atribuir tarefas a colaboradores
- ✅ Adicionar intervenientes (stakeholders)
- ✅ Definir prazos (horas, dias ou data específica)
- ✅ Fluxo de estados completo:
  - 👁️ **Visto** - Tarefa recebida
  - ▶️ **Aberto** - Tarefa aberta
  - ⏰ **Por Iniciar** - Pronta para começar
  - 🔄 **Em Progresso** - Em execução
  - ✅ **Terminado** - Concluída (aguarda validação)
  - 🔒 **Fechado** - Validada pelo administrador
  - 🚨 **Entrega Atrasada** - Prazo ultrapassado (automático)

### 👥 **Gestão de Utilizadores**
- ✅ Criar e gerir contas de utilizadores
- ✅ Dois tipos de perfis:
  - **Administrador** - Controlo total do sistema
  - **Colaborador** - Acesso às suas tarefas
- ✅ Ativar/desativar utilizadores
- ✅ Atribuir departamentos e cargos

### 🔔 **Notificações Inteligentes**
- ✅ Notificações em tempo real
- ✅ Tons inteligentes (urgente, normal, informativo)
- ✅ Alertas de prazos próximos
- ✅ Notificações de mudança de estado
- ✅ Pedidos de validação

### 📊 **Relatórios e Análises**
- ✅ Estatísticas gerais de tarefas
- ✅ Distribuição por estado
- ✅ Performance individual de utilizadores
- ✅ Taxa de conclusão
- ✅ Tempo médio de conclusão
- ✅ Ranking de desempenho

### 🌐 **Multilíngue**
- ✅ Português
- ✅ Inglês
- ✅ Alternância instantânea de idioma

### 🎨 **Interface Moderna**
- ✅ Design responsivo (mobile, tablet, desktop)
- ✅ Tema claro e escuro
- ✅ Animações suaves
- ✅ Ícones minimalistas
- ✅ Tipografia: Poppins (títulos) + PT Sans (corpo)

---

## 🚀 Como Começar

### **Pré-requisitos**
- Node.js 18+
- npm ou pnpm

### **Instalação**

```bash
npm install
```

### **Desenvolvimento**

```bash
npm run dev
```

Acesse `http://localhost:4321`

### **Build**

```bash
npm run build
```

### **Preview**

```bash
npm run preview
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/              # Componentes React
│   ├── ui/                 # Componentes shadcn/ui
│   ├── AppLayout.tsx       # Layout principal
│   ├── LoginPage.tsx       # Página de login
│   ├── TaskBoard.tsx       # Quadro de tarefas
│   ├── TaskCard.tsx        # Cartão de tarefa
│   ├── TaskModal.tsx       # Modal de criação/edição
│   ├── NotificationPanel.tsx
│   ├── UserManagement.tsx
│   ├── ReportsAnalytics.tsx
│   ├── SettingsModal.tsx
│   ├── ProfileModal.tsx
│   └── TaskboardApp.tsx    # App principal
├── lib/                     # Utilitários e serviços
│   ├── api-client.ts       # Cliente HTTP para API Java
│   ├── api-adapter.ts      # Conversores de dados
│   ├── store.ts            # Dados mock (temporário)
│   ├── translations.ts     # Traduções PT/EN
│   └── utils.ts            # Funções auxiliares
├── types/                   # Definições TypeScript
│   ├── index.ts            # Tipos principais
│   └── api.ts              # Tipos de API
├── pages/
│   ├── api/                # Endpoints API (mock)
│   └── index.astro         # Página principal
└── styles/
    └── global.css          # Estilos globais
```

---

## 🔐 Perfis de Utilizador

### **Administrador (Director)**
- ✅ Acesso total ao sistema
- ✅ Criar, editar e eliminar tarefas
- ✅ Gerir utilizadores
- ✅ Estender prazos de tarefas
- ✅ Validar tarefas concluídas
- ✅ Ver relatórios e análises
- ✅ Atribuir tarefas a qualquer utilizador

### **Colaborador (Funcionário)**
- ✅ Ver tarefas atribuídas
- ✅ Alterar estado das tarefas
- ✅ Ver detalhes das tarefas
- ❌ Não pode editar título, descrição ou prazo
- ❌ Acesso limitado às suas tarefas

---

## 🌐 API Endpoints

### **Autenticação**
```
POST   /api/auth/login           # Login
POST   /api/auth/logout          # Logout
GET    /api/auth/me              # Obter utilizador atual
POST   /api/auth/refresh         # Renovar token
```

### **Tarefas**
```
GET    /api/tasks                # Listar tarefas
GET    /api/tasks/:id            # Obter tarefa
POST   /api/tasks                # Criar tarefa
PUT    /api/tasks/:id            # Atualizar tarefa
DELETE /api/tasks/:id            # Eliminar tarefa
PATCH  /api/tasks/:id/status     # Atualizar estado
GET    /api/tasks/user/:userId   # Tarefas de utilizador
GET    /api/tasks/overdue        # Tarefas atrasadas
```

### **Utilizadores**
```
GET    /api/users                # Listar utilizadores
GET    /api/users/:id            # Obter utilizador
POST   /api/users                # Criar utilizador
PUT    /api/users/:id            # Atualizar utilizador
DELETE /api/users/:id            # Eliminar utilizador
GET    /api/users/employees      # Listar colaboradores
```

### **Notificações**
```
GET    /api/notifications        # Listar notificações
GET    /api/notifications/unread # Não lidas
PATCH  /api/notifications/:id/read   # Marcar como lida
PATCH  /api/notifications/read-all   # Marcar todas
DELETE /api/notifications/:id    # Eliminar
```

### **Relatórios**
```
GET    /api/reports/statistics   # Estatísticas
GET    /api/reports/user-performance  # Performance
GET    /api/reports/export?format=pdf # Exportar PDF
```

### **WebSocket**
```
WS     /ws                       # Notificações em tempo real
```

---

## 🛠️ Tecnologias

### **Frontend**
- **Astro** - Framework web moderno
- **React** - Componentes UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Biblioteca de componentes
- **Lucide React** - Ícones

### **Backend (Preparado para)**
- **Java** - Linguagem de programação
- **Spring Boot** - Framework
- **PostgreSQL/MySQL** - Banco de dados
- **JWT** - Autenticação
- **WebSocket** - Tempo real

---

## 📊 Sistema de Notificações

Notificações inteligentes com tons automáticos:

| Evento | Tom | Descrição |
|--------|-----|-----------|
| Tarefa atrasada | 🚨 Urgente | Prazo ultrapassado |
| Prazo < 24h | 🚨 Urgente | Prazo iminente |
| Prazo < 3 dias | ⚠️ Normal | Prazo próximo |
| Nova tarefa | ℹ️ Informativo | Tarefa atribuída |
| Mudança de estado | ℹ️ Informativo | Estado atualizado |
| Extensão de prazo | ℹ️ Informativo | Prazo estendido |

---

## 🎨 Personalização

### **Alterar Estados**

Edite `src/types/index.ts`:

```typescript
export type TaskStatus = 
  | 'Seus' 
  | 'Estados' 
  | 'Personalizados';
```

### **Integrar Base de Dados**

Substitua `src/lib/store.ts` pelo seu cliente de BD (Prisma, Drizzle, etc).

### **Conectar Backend Java**

1. Configure `.env` com URLs do backend
2. Implemente endpoints seguindo `BACKEND_EXAMPLES.md`
3. Teste com Postman/Insomnia
4. Frontend automaticamente usa a API

---

## 📝 Exemplos de Uso

### **Login**
```typescript
import { authAPI, saveAuthToken } from './lib/api-client';

const response = await authAPI.login({
  email: 'admin@gestora.com',
  password: 'senha123'
});

saveAuthToken(response.token);
```

### **Criar Tarefa**
```typescript
import { tasksAPI } from './lib/api-client';

const task = await tasksAPI.createTask({
  title: 'Desenvolver Dashboard',
  description: 'Criar dashboard de relatórios',
  startDate: new Date().toISOString(),
  deadlineType: 'days',
  deadlineValue: 7,
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  assignedTo: 'user-id-123',
  stakeholders: ['user-id-456']
});
```

### **Conectar WebSocket**
```typescript
import { NotificationWebSocket } from './lib/api-client';

const ws = new NotificationWebSocket(
  (notification) => {
    console.log('Nova notificação:', notification);
  }
);

ws.connect();
```

---

## 🧪 Testes

### **Testar Backend**

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gestora.com","password":"senha123"}'

# Listar tarefas
curl -X GET http://localhost:8080/api/tasks \
  -H "Authorization: Bearer {token}"
```

### **Testar Frontend**

```typescript
// src/test-api.ts
import { authAPI, tasksAPI } from './lib/api-client';

async function test() {
  const res = await authAPI.login({
    email: 'admin@gestora.com',
    password: 'senha123'
  });
  console.log('✅ Login:', res.user);

  const tasks = await tasksAPI.getAllTasks();
  console.log('✅ Tarefas:', tasks.length);
}

test();
```

---

## 🚀 Deploy

### **Frontend (Cloudflare Pages)**

```bash
npm run build
```

### **Backend (Java)**

```bash
mvn clean package
java -jar target/gestora-backend.jar
```

---

## 📄 Licença

MIT

---

## 🤝 Contribuir

Contribuições são bem-vindas! Abra uma issue ou envie um pull request.

---

## 📞 Suporte

Para dúvidas sobre integração:
- 📖 Leia [QUICK_START.md](./QUICK_START.md)
- 📖 Consulte [API_INTEGRATION.md](./API_INTEGRATION.md)
- 📖 Veja exemplos em [BACKEND_EXAMPLES.md](./BACKEND_EXAMPLES.md)

---

## ✅ Status do Projeto

- ✅ Frontend 100% completo
- ✅ Interface responsiva
- ✅ Sistema de notificações
- ✅ Relatórios e análises
- ✅ Multilíngue (PT/EN)
- ✅ Tema claro/escuro
- ✅ Preparado para API Java
- ✅ Documentação completa
- ⏳ Backend Java (em desenvolvimento)

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Pronto para produção (frontend)  
**Integração Backend:** ✅ Preparado e documentado

