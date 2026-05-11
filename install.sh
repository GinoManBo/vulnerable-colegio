#!/bin/bash
# Script de un solo comando para Linux/macOS
# Uso: curl -fsSL https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/install.sh | bash

set -e

INSTALL_DIR="$HOME/vulnerable-colegio"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

if [ ! -f "docker-compose.yml" ]; then
    curl -fsSL https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/docker-compose.prod.yml -o docker-compose.yml
fi

docker compose up -d

echo ""
echo "✅ Listo! Abre http://localhost en tu navegador"
echo ""
