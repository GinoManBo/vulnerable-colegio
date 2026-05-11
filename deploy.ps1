# ─────────────────────────────────────────────
#  Script de despliegue para Windows
#  Descarga imágenes de Docker Hub y levanta
#  la app completa en cualquier PC con Windows
# ─────────────────────────────────────────────
# Uso:
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
# ─────────────────────────────────────────────

$DOCKER_USER = "ginolxdlol"
$COMPOSE_URL = "https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/docker-compose.prod.yml"

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Despliegue de Vulnerable Colegio (Windows)" -ForegroundColor Cyan
Write-Host "  Docker Hub: $DOCKER_USER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        Write-Host "❌ Docker no está instalado" -ForegroundColor Red
        Write-Host "Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker detectado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    Write-Host "Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Crear carpeta del proyecto
$INSTALL_DIR = "$env:USERPROFILE\vulnerable-colegio"
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
Set-Location $INSTALL_DIR

Write-Host "📁 Directorio: $INSTALL_DIR" -ForegroundColor White
Write-Host ""

# 3. Descargar docker-compose.yml
Write-Host "[2/6] Descargando configuración..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.yml")) {
    try {
        Invoke-WebRequest -Uri $COMPOSE_URL -OutFile "docker-compose.yml" -UseBasicParsing
        Write-Host "✅ docker-compose.yml descargado" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al descargar docker-compose.yml" -ForegroundColor Red
        Write-Host "$_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ docker-compose.yml ya existe" -ForegroundColor Green
}
Write-Host ""

# 4. Crear archivo .env
Write-Host "[3/6] Creando archivo de configuración (.env)..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    @"
# ─────────────────────────────────────────────
#  Configuración de la aplicación
# ─────────────────────────────────────────────

# Base de datos
MONGO_URI=mongodb://mongo:27017/vulnerable-colegio

# Puerto del backend
PORT=5000

# Entorno (production | development)
NODE_ENV=production

# Clave secreta para JWT (cambiala en produccion!)
JWT_SECRET=cambia_esta_clave_por_una_segura_$(Get-Random -Maximum 99999)

# URL del cliente (frontend)
CLIENT_URL=http://localhost
"@ | Out-File -FilePath ".env" -Encoding UTF8

    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Edita el archivo .env y cambia JWT_SECRET" -ForegroundColor Yellow
} else {
    Write-Host "✅ Archivo .env ya existe" -ForegroundColor Green
}
Write-Host ""

# 5. Pull de imágenes
Write-Host "[4/6] Descargando imágenes de Docker Hub..." -ForegroundColor Yellow
docker compose pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al descargar imágenes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imágenes descargadas" -ForegroundColor Green
Write-Host ""

# 6. Levantar servicios
Write-Host "[5/6] Iniciando servicios..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 7. Esperar un poco
Write-Host "[6/6] Esperando servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# 8. Verificar estado
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Estado de los servicios" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
docker compose ps
Write-Host ""

# 9. Mostrar URLs
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Despliegue completado" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend:     http://localhost" -ForegroundColor White
Write-Host "🔌 Backend API:  http://localhost:5000/api" -ForegroundColor White
Write-Host "🗄️  MongoDB:      localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Comandos utiles:" -ForegroundColor Gray
Write-Host "  Ver logs:       docker compose logs -f" -ForegroundColor Gray
Write-Host "  Detener:        docker compose down" -ForegroundColor Gray
Write-Host "  Reiniciar:      docker compose restart" -ForegroundColor Gray
Write-Host "  Actualizar:     docker compose pull && docker compose up -d" -ForegroundColor Gray
Write-Host "─────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# 10. Preguntar si poblar base de datos
$poblar = Read-Host "Quieres poblar la base de datos con datos de prueba? (s/N)"
if ($poblar -eq 's' -or $poblar -eq 'S') {
    Write-Host "🌱 Poblando base de datos..." -ForegroundColor Yellow
    docker compose exec backend node seed.js 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  El seed no esta disponible en la imagen" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "✨ Listo! Abre http://localhost en tu navegador" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona ENTER para salir"
