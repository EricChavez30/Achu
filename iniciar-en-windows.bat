@echo off
title TikTok LIVE Prototype - Local Windows Server
color 0B
echo =====================================================================
echo   TIKTOK LIVE PROTOTYPE - SERVIDOR LOCAL WINDOWS
echo   Conexion directa mediante tiktok-live-connector (IP Residencial)
echo =====================================================================
echo.

:: Verificar si Node.js esta instalado en el sistema
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado en tu PC Windows.
    echo Por favor descarga la version LTS (v20 o v22) desde:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado:
node -v
npm -v
echo.

echo [1/2] Verificando e instalando dependencias de Node.js...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Ocurrio un problema ejecutando npm install.
    pause
    exit /b 1
)

echo.
echo [2/2] Levantando Servidor Full-Stack (Backend Express + Frontend Vite)...
echo Servidor escuchando en: http://localhost:3000
echo.
echo Cuenta de prueba predeterminada: @ERIC_ACHU
echo Eventos detectados: Chat, Likes, Regalos, Follows, Viewers
echo.
echo Presiona Ctrl + C en esta ventana cuando desees detener el servidor.
echo.

call npm run dev

pause

