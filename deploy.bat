@echo off
chcp 65001 >nul
cls
echo ╔═══════════════════════════════════════════════════════╗
echo ║   Vulnerable Colegio - Instalador Rapido (Windows)   ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

:: 1. Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no esta instalado.
    echo.
    echo Descargalo desde: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo ✅ Docker detectado.
echo.

:: 2. Crear carpeta
set INSTALL_DIR=%USERPROFILE%\vulnerable-colegio
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

echo 📁 Instalando en: %INSTALL_DIR%
echo.

:: 3. Descargar docker-compose.yml
if not exist "docker-compose.yml" (
    echo 📥 Descargando configuracion...
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/docker-compose.prod.yml' -OutFile 'docker-compose.yml' -UseBasicParsing" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Error descargando. Revisa tu internet.
        pause
        exit /b 1
    )
    echo ✅ Configuracion descargada.
) else (
    echo ✅ Configuracion ya existe.
)
echo.

:: 4. Crear .env
if not exist ".env" (
    echo ⚙️  Creando configuracion...
    (
        echo MONGO_URI=mongodb://mongo:27017/vulnerable-colegio
        echo PORT=5000
        echo NODE_ENV=production
        echo JWT_SECRET=mi_clave_secreta_%RANDOM%%RANDOM%
        echo CLIENT_URL=http://localhost
    ) > .env
    echo ✅ Configuracion creada.
) else (
    echo ✅ Configuracion ya existe.
)
echo.

:: 5. Descargar imagenes
echo 🐳 Descargando imagenes de Docker Hub...
docker compose pull
echo.

:: 6. Levantar servicios
echo 🚀 Iniciando servicios...
docker compose up -d
echo.

:: 7. Esperar
ping -n 6 127.0.0.1 >nul

:: 8. Estado
echo ╔═══════════════════════════════════════════════════════╗
echo ║           ✅ DESPLIEGUE COMPLETADO                   ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo 🌐 Abre tu navegador en:
echo    http://localhost
echo.
echo 🔌 API del backend:
echo    http://localhost:5000/api
echo.
echo 📋 Comandos utiles:
echo    docker compose logs -f    (ver logs)
echo    docker compose down       (detener)
echo    docker compose restart    (reiniciar)
echo.

:: 9. Preguntar seed
set /p SEED=Quieres crear datos de prueba? (s/N): 
if /i "%SEED%"=="s" (
    echo 🌱 Creando datos de prueba...
    docker compose exec backend node seed.js 2>nul
    if errorlevel 1 (
        echo ⚠️  Datos de prueba no disponibles en esta version.
    ) else (
        echo ✅ Datos creados.
    )
    echo.
)

echo ✨ Todo listo! Presiona una tecla para cerrar.
pause >nul
