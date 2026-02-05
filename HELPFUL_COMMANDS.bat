@echo off
REM ============================================
REM GestoraPro - Comandos Úteis (Windows)
REM ============================================

echo.
echo 🚀 GestoraPro - Comandos Disponíveis
echo =====================================
echo.
echo 1. DESENVOLVIMENTO
echo    npm run dev              - Inicia servidor de desenvolvimento
echo    npm run build            - Faz build para produção
echo    npm run preview          - Preview da build
echo.
echo 2. TESTES API
echo    Abrir console do navegador (F12)
echo    Colar: import { runAPITests } from './services/apiTest.ts'; runAPITests();
echo.
echo 3. VARIÁVEIS DE AMBIENTE
echo    Copiar .env.example para .env.local (opcional)
echo    VITE_API_BASE_URL=https://b44f-2c0f-f888-a180-946c-8939-147d-5111-65ca.ngrok-free.app
echo.
echo 4. CREDENCIAIS DE TESTE
echo    Admin: admin@example.com / admin123
echo    User:  user@example.com / 123456
echo.
echo 5. INSTALAÇÃO RÁPIDA
echo    npm install
echo    npm run dev
echo    Abrir http://localhost:5173
echo.
echo 6. VERIFICAÇÕES NO CONSOLE DO NAVEGADOR
echo    - localStorage.clear()      Limpar dados
echo    - localStorage.getItem('gestora_api_token')  Ver token
echo    - console.table(localStorage)  Todos dados
echo.
echo 7. ERROS COMUNS
echo    Erro: API não responde
echo    Solução: Verificar URL em vite.config.ts
echo    Solução: Executar runAPITests()
echo.
echo =====================================
echo Documentação:
echo  - API_QUICK_START.md
echo  - API_INTEGRATION.md
echo  - INTEGRATION_CHANGES.md
echo.
pause
