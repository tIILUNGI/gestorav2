# Integração da API Fly.dev

## Configuração da API

**Base URL:** `https://ilungi-gestora-api.fly.dev/api`

A aplicação foi configurada para se conectar com a API hospedada em Fly.dev.

## Endpoints Implementados

### Autenticação
- **POST** `/auth/login` - Login com email e password
- **POST** `/auth/register` - Registrar novo utilizador
- **GET** `/auth/me` - Obter dados do utilizador autenticado

### Tarefas
- **GET** `/tasks` - Listar todas as tarefas
- **GET** `/tasks/{id}` - Obter tarefa específica
- **POST** `/tasks` - Criar nova tarefa
- **PUT** `/tasks/{id}` - Atualizar tarefa
- **PATCH** `/tasks/{id}/status` - Atualizar status da tarefa
- **DELETE** `/tasks/{id}` - Eliminar tarefa

### Utilizadores
- **GET** `/users` - Listar todos os utilizadores (requer ADMIN)
- **GET** `/users/{id}` - Obter utilizador específico
- **PUT** `/users/{id}` - Atualizar utilizador (requer ADMIN)
- **DELETE** `/users/{id}` - Eliminar utilizador (requer ADMIN)

### Comentários
- **GET** `/tasks/{taskId}/comments` - Listar comentários de uma tarefa
- **POST** `/tasks/{taskId}/comments` - Criar comentário
- **DELETE** `/tasks/{taskId}/comments/{commentId}` - Eliminar comentário

### Atividades
- **GET** `/activities` - Listar todas as atividades
- **GET** `/activities/task/{taskId}` - Listar atividades de uma tarefa

### Notificações
- **GET** `/notifications` - Listar notificações
- **PATCH** `/notifications/{id}/read` - Marcar como lida

### Relatórios
- **GET** `/reports/stats` - Obter estatísticas gerais
- **GET** `/reports/user-performance` - Desempenho dos utilizadores
- **GET** `/reports/task-stats` - Estatísticas das tarefas

## Autenticação

A autenticação é feita através de JWT (JSON Web Token).

### Fluxo de Login
1. Cliente envia email e password para `/auth/login`
2. API retorna token JWT
3. Token é guardado em `localStorage` como `gestora_api_token`
4. Token é enviado em cada requisição no header: `Authorization: Bearer {token}`

### Exemplo de Login
```typescript
const response = await apiAuth.login('user@example.com', 'password123');
// Response contém: { token, user, ... }
```

## Mappers de Dados

A aplicação utiliza mappers para converter dados da API para o formato interno:

- `mapUserFromAPI()` - Converte utilizador da API
- `mapTaskFromAPI()` - Converte tarefa da API
- `mapCommentFromAPI()` - Converte comentário da API

Estes mappers garantem compatibilidade entre diferentes estruturas de resposta da API.

## Tratamento de Erros

A aplicação implementa:
1. **Retry com Fallback** - Se a API falhar, dados locais são usados
2. **Logging detalhado** - Todos os erros são registados
3. **Mensagens de erro** - Utilizador é informado de problemas

## Configuração da Variável de Ambiente

Para usar uma URL de API diferente, configure a variável `VITE_API_BASE_URL`:

```bash
VITE_API_BASE_URL=https://sua-api.com
```

## Sincronização Local-API

- Quando há token de autenticação válido, a aplicação tenta carregar dados da API
- Se a API falhar, continua com dados locais
- Sempre que uma ação é realizada, é tentado atualizar na API
- Se falhar, é guardado localmente e sincronizado depois

## Troubleshooting

### Erro de CORS
Se receber erro de CORS, certifique-se que:
1. A API tem CORS configurado para o seu domínio
2. Headers adequados são enviados

### Token Inválido
- Token expirado: fazer logout e novo login
- Token malformado: limpar localStorage e fazer novo login

### API não responde
- Verificar se a URL da API está correta
- Verificar conectividade de rede
- Consultar logs da API em Fly.dev

## Mais Informações

Para mais detalhes sobre a API, consulte a documentação do backend em `gestora-backend/README.md`
