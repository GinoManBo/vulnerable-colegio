# syntax=docker/dockerfile:1

FROM node:20-alpine

LABEL org.opencontainers.image.title="Vulnerable Colegio - Backend"
LABEL org.opencontainers.image.description="Plataforma de empleo técnico - Backend Express + MongoDB"
LABEL org.opencontainers.image.authors="Cristobal Montoya, Gino Monsalvez, Benjamin Ruiz"
LABEL org.opencontainers.image.source="https://github.com/GinoManBo/vulnerable-colegio"

WORKDIR /app

# Crear directorio para uploads
RUN mkdir -p /app/uploads && chown -R node:node /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY --chown=node:node . .

# Puerto expuesto
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Usar usuario no-root
USER node

CMD ["node", "index.js"]
