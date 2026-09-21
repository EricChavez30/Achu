@echo off
title TikTok LIVE Server
cd /d "%~dp0"
echo ===================================================
echo     TIKTOK LIVE SERVER - DIAGNOSTICO Y ARRANQUE
echo ===================================================
echo.
echo Carpeta actual: %CD%
echo.

node -v >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encuentra Node.js en esta ventana.
    echo Buscando en carpetas tipicas de Windows...
    if exist "%ProgramFiles%
odejs
ode.exe" (
        set "PATH=%ProgramFiles%
odejs;%PATH%"
        echo Encontrado en Program Files!
    ) else if exist "%LocalAppData%\Programs
ode
ode.exe" (
        set "PATH=%LocalAppData%\Programs
ode;%PATH%"
        echo Encontrado en LocalAppData!
    ) else (
        echo [ERROR CRITICO] Node.js no esta instalado en este equipo.
        echo Por favor instala Node.js desde: https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Version de Node instalada:
call node -v
echo [OK] Version de NPM:
call npm -v
echo.

if not exist "node_modules" (
    echo [1/2] Instalando dependencias necesarias...
    echo Esto se hace una sola vez y tardara unos segundos...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de paquetes npm.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencias ya listas en node_modules.
)

echo.
echo [2/2] Iniciando servidor Express + Vite...
echo Panel de control: http://localhost:3000
echo Overlay para OBS: http://localhost:3000/overlay
echo.
echo Presiona Ctrl + C para detener el servidor.
echo ===================================================
echo.

call npm run dev

echo.
echo El servidor se ha cerrado.
pause
