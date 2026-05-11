#!/bin/bash
# ─────────────────────────────────────────────
#  Script para build y push a Docker Hub
# ─────────────────────────────────────────────
# Uso:
#   chmod +x docker-push.sh
#   ./docker-push.sh [TAG]
#
# Si no se especifica TAG, usa "latest"
# ─────────────────────────────────────────────

set -e

DOCKER_USER="ginolxdlol"
TAG=${1:-latest}

echo "═══════════════════════════════════════════════"
echo "  Docker Build & Push"
echo "  Usuario: $DOCKER_USER"
echo "  Tag: $TAG"
echo "═══════════════════════════════════════════════"
echo ""

# Verificar login en Docker Hub
if ! docker info | grep -q "Username"; then
    echo "Error: No has iniciado sesión en Docker Hub"
    echo "Ejecuta: docker login"
    exit 1
fi

# Build frontend
echo "[1/4] Building frontend image..."
docker build -t $DOCKER_USER/vulnerable-colegio-frontend:$TAG .

# Build backend
echo "[2/4] Building backend image..."
docker build -t $DOCKER_USER/vulnerable-colegio-backend:$TAG ./backend

# Push frontend
echo "[3/4] Pushing frontend to Docker Hub..."
docker push $DOCKER_USER/vulnerable-colegio-frontend:$TAG

# Push backend
echo "[4/4] Pushing backend to Docker Hub..."
docker push $DOCKER_USER/vulnerable-colegio-backend:$TAG

echo ""
echo "═══════════════════════════════════════════════"
echo "  Build & Push completado"
echo "═══════════════════════════════════════════════"
echo ""
echo "Imágenes publicadas:"
echo "  - $DOCKER_USER/vulnerable-colegio-frontend:$TAG"
echo "  - $DOCKER_USER/vulnerable-colegio-backend:$TAG"
echo ""
echo "Para desplegar en producción:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
