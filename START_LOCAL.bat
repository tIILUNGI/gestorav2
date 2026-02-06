@echo off
chcp 65001 >nul
echo ================================================
echo    GESTORA Pro - Inicializacao LOCAL
echo ================================================
echo.

REM Verificar se MySQL está a correr
echo [1/3] Verificando MySQL...
netstat -an | findstr ":3306" >nul
if %errorlevel% equ 0 (
    echo    OK - MySQL esta a correr na porta 3306
) else (
    echo    AVISO - MySQL nao esta a correr!
    echo    Por favor inicie o MySQL primeiro:
    echo    - XAMPP: Inicie o modulo MySQL
    echo    - Ou: net start mysql
    echo.
)
echo.

REM Iniciar Backend
echo [2/3] Iniciando Backend (porta 8080)...
echo    O backend estara disponivel em: http://localhost:8080/api
echo.
cd gestoresPro2\gestoraPro (2)\gestoraPro\gestora-backend
start "GESTORA Backend" cmd /c "mvn spring-boot:run"
echo.
timeout /t 5 /nobreak >nul

REM Iniciar Frontend
echo [3/3] Iniciando Frontend (porta 5173)...
echo    O frontend estara disponivel em: http://localhost:5173
echo.
cd ..
start "GESTORA Frontend" cmd /c "npm run dev"

echo.
echo ================================================
echo    SISTEMA INICIADO!
echo ================================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8080/api
echo.
echo   Para login, utilize:
echo   Email: admin@gestora.com
echo   Senha: admin123
echo.
echo ================================================
pause
