#!/bin/bash
# ─────────────────────────────────────────────
#  Script de despliegue automático
#  Descarga imágenes de Docker Hub y levanta
#  la app completa en cualquier computador
# ─────────────────────────────────────────────
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh
# ─────────────────────────────────────────────

set -e

DOCKER_USER="ginolxdlol"
COMPOSE_URL="https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/docker-compose.prod.yml"

echo "═══════════════════════════════════════════════"
echo "  Despliegue de Vulnerable Colegio"
echo "  Docker Hub: $DOCKER_USER"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    echo "Instálalo primero: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    echo "Instálalo primero"
    exit 1
fi

echo "✅ Docker detectado"
echo ""

# 2. Crear carpeta del proyecto
INSTALL_DIR="$HOME/vulnerable-colegio"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "📁 Directorio: $INSTALL_DIR"
echo ""

# 3. Descargar docker-compose.prod.yml si no existe
if [ ! -f "docker-compose.yml" ]; then
    echo "📥 Descargando configuración..."
    if command -v curl &> /dev/null; then
        curl -sL "$COMPOSE_URL" -o docker-compose.yml
    elif command -v wget &> /dev/null; then
        wget -q "$COMPOSE_URL" -O docker-compose.yml
    else
        echo "❌ Necesitas curl o wget para descargar el archivo"
        exit 1
    fi
    echo "✅ docker-compose.yml descargado"
else
    echo "✅ docker-compose.yml ya existe"
fi
echo ""

# 4. Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "⚙️  Creando archivo de configuración (.env)..."
    cat > .env << 'EOF'
# ─────────────────────────────────────────────
#  Configuración de la aplicación
# ─────────────────────────────────────────────

# Base de datos
MONGO_URI=mongodb://mongo:27017/vulnerable-colegio

# Puerto del backend
PORT=5000

# Entorno (production | development)
NODE_ENV=production

# Clave secreta para JWT (¡cámbiala en producción!)
JWT_SECRET=cambia_esta_clave_por_una_segura_12345

# URL del cliente (frontend)
CLIENT_URL=http://localhost
EOF
    echo "✅ Archivo .env creado"
    echo "⚠️  IMPORTANTE: Edita el archivo .env y cambia JWT_SECRET"
else
    echo "✅ Archivo .env ya existe"
fi
echo ""

# 5. Pull de imágenes desde Docker Hub
echo "🐳 Descargando imágenes de Docker Hub..."
docker compose pull
echo "✅ Imágenes descargadas"
echo ""

# 6. Levantar servicios
echo "🚀 Iniciando servicios..."
docker compose up -d
echo ""

# 7. Esperar a que mongo esté listo
echo "⏳ Esperando a MongoDB..."
sleep 5

# 8. Verificar estado
echo ""
echo "═══════════════════════════════════════════════"
echo "  Estado de los servicios"
echo "═══════════════════════════════════════════════"
docker compose ps
echo ""

# 9. Mostrar URLs
echo "═══════════════════════════════════════════════"
echo "  Despliegue completado"
echo "═══════════════════════════════════════════════"
echo ""
echo "🌐 Frontend:     http://localhost"
echo "🔌 Backend API:  http://localhost:5000/api"
echo "🗄️  MongoDB:      localhost:27017"
echo ""
echo "─────────────────────────────────────────────────"
echo "Comandos útiles:"
echo "  Ver logs:       docker compose logs -f"
echo "  Detener:        docker compose down"
echo "  Reiniciar:      docker compose restart"
echo "  Actualizar:     docker compose pull && docker compose up -d"
echo "─────────────────────────────────────────────────"
echo ""

# 10. Preguntar si poblar base de datos
read -p "¿Quieres poblar la base de datos con datos de prueba? (s/N): " respuesta
if [[ "$respuesta" =~ ^[Ss]$ ]]; then
    echo "🌱 Poblando base de datos..."
    docker compose exec backend node seed.js || echo "⚠️  El seed no está disponible en la imagen"
    echo ""
fi

echo "✨ Listo! Abre http://localhost en tu navegador"
echo ""
