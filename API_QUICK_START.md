# 🚀 Guia de Início - Integração da API Fly.dev

## ✅ O que foi feito

A aplicação **GestoraPro** foi totalmente reconfigurada para usar a API hospedada em:
```
https://ilungi-gestora-api.fly.dev
```

---

## 🎯 Próximos Passos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente (Opcional)

Se quiser usar um servidor de API diferente, edite ou crie um ficheiro `.env.local`:

```env
VITE_API_BASE_URL=https://ilungi-gestora-api.fly.dev
GEMINI_API_KEY=sua_chave_aqui
```

**Nota:** O valor padrão já está configurado para Fly.dev, portanto esta etapa é opcional.

### 3️⃣ Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

A aplicação abrirá em `http://localhost:5173`

---

## 🔐 Credenciais de Teste

Para testar a login, use:

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Utilizador Normal:**
- Email: `user@example.com`
- Password: `123456`

---

## 📊 Testar a Integração da API

Abra o **console do navegador** (F12) e execute:

```javascript
// Importar e executar testes
import { runAPITests } from './services/apiTest.ts';
runAPITests().then(results => console.table(results));
```

Verá um relatório detalhado com:
- ✅/❌ Status de cada teste
- 📊 Tempo de resposta
- 💬 Mensagens descritivas

---

## 📁 Ficheiros Principais

### Alterados
- **`services/apiService.ts`** - Serviço de API com nova URL
- **`App.tsx`** - Carregamento de dados da API
- **`.env.example`** - Variáveis de ambiente atualizadas

### Novos Ficheiros
- **`API_INTEGRATION.md`** - Documentação completa da API
- **`INTEGRATION_CHANGES.md`** - Resumo detalhado das alterações
- **`services/apiTest.ts`** - Tester automático da API

---

## 🔄 Fluxo de Funcionamento

```
┌─────────────────┐
│  App Iniciada   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Carregar Token  │
│ do localStorage │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Token? │
    └──┬──┬───┘
       │  │
      SIM NÃO
       │  │
       │  └─────► Mostrar Página de Login
       │
       ▼
┌──────────────────┐
│ Tentar Carregar  │
│  Dados da API    │
└────────┬─────────┘
         │
    ┌────▼────┐
    │ Sucesso?│
    └──┬──┬───┘
      SIM NÃO
       │  │
       │  └─────► Usar Dados Locais
       │
       ▼
┌──────────────────┐
│   App Pronto     │
│   Tarefas, etc.  │
└──────────────────┘
```

---

## 🛠️ Operações Suportadas

### Dashboard
- ✅ Ver tarefas
- ✅ Ver utilizadores (admin)
- ✅ Ver atividades do sistema
- ✅ Ver notificações

### Tarefas
- ✅ Criar tarefa (via API)
- ✅ Editar tarefa (via API)
- ✅ Eliminar tarefa (via API)
- ✅ Alterar status (via API)
- ✅ Adicionar comentários (via API)

### Utilizadores
- ✅ Visualizar perfil
- ✅ Atualizar avatar
- ✅ Ver histórico (admin)

---

## 🔐 Segurança

- ✅ Autenticação via JWT
- ✅ Token armazenado em localStorage
- ✅ Validação de permissões (ADMIN/EMPLOYEE)
- ✅ CORS configurado
- ✅ Headers de segurança

---

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android)
- ✅ Mobile (Responsivo)

---

## 🆘 Problemas Comuns

### "A API não responde"
1. Verificar internet
2. Validar URL: https://ilungi-gestora-api.fly.dev
3. Verificar console do navegador (F12)
4. Executar `runAPITests()`

### "Login não funciona"
1. Verificar credenciais
2. Limpar cache: `localStorage.clear()`
3. Recarregar página: F5
4. Verificar console para erros

### "Tarefas não aparecem"
1. Se houver dados locais, aparecerão
2. Se falhar a API, fallback automático
3. Tentar recarregar página
4. Executar testes da API

---

## 📚 Documentação

### Para Desenvolvedores
1. **API_INTEGRATION.md** - Guia técnico completo
2. **INTEGRATION_CHANGES.md** - Resumo de alterações
3. **services/apiService.ts** - Código-fonte comentado

### Para Utilizadores
1. **README.md** - Visão geral da aplicação
2. **QUICK_START.md** - Guia de início rápido
3. Este ficheiro - Setup da API

---

## ✨ Features Implementadas

### Sync Local-API
```typescript
// Automático!
if (houverToken) {
  carregarDadosDaAPI(); // Tenta API
  // Se falhar → usa dados locais
  // Se suceder → sincroniza dados
}
```

### Fallback Inteligente
```typescript
// Criar tarefa
try {
  resposta = await criar_na_API();
  usar_resposta_da_API();
} catch {
  // Fallback local
  salvar_localmente();
}
```

### Logging Completo
```typescript
// Tudo é registado
logger.debug('API', 'Mensagem aqui');
logger.warn('Erro', 'Detalhes');
// Veja em: localStorage → gestora_logs
```

---

## 🎓 Aprender Mais

### API Endpoints
```bash
GET    /api/tasks              # Listar tarefas
POST   /api/tasks              # Criar tarefa
PUT    /api/tasks/{id}         # Atualizar
DELETE /api/tasks/{id}         # Eliminar
PATCH  /api/tasks/{id}/status  # Alterar status
```

Veja **API_INTEGRATION.md** para lista completa.

---

## 🚀 Deploy

### Para Produção
```bash
# Build
npm run build

# Verá pasta dist/ criada
# Deploy dist/ para seu servidor
```

A API automaticamente usa:
```
https://ilungi-gestora-api.fly.dev
```

---

## 📞 Suporte

Se tiver problemas:
1. Verificar console (F12 → Console tab)
2. Executar `runAPITests()`
3. Ler API_INTEGRATION.md
4. Verificar code em services/apiService.ts

---

**Bem-vindo ao GestoraPro com Fly.dev! 🎉**

Pronto para começar? Execute:
```bash
npm install && npm run dev
```
