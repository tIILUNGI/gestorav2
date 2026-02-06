@echo off
chcp 65001 >nul
echo ================================================
echo    ILUNGI GESTORA API - Inicializacao LOCAL
echo ================================================
echo.
cd ilungi.gestora.api
echo [1/2] Compilando e iniciando API com MySQL local...
echo    A API estara disponivel em: http://localhost:8080
echo.
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
