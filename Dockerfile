# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────
#  FRONTEND BUILD
# ─────────────────────────────────────────────
FROM node:20-alpine AS build

LABEL org.opencontainers.image.title="Vulnerable Colegio - Frontend"
LABEL org.opencontainers.image.description="Plataforma de empleo técnico - Frontend React"
LABEL org.opencontainers.image.authors="Cristobal Montoya, Gino Monsalvez, Benjamin Ruiz"
LABEL org.opencontainers.image.source="https://github.com/GinoManBo/vulnerable-colegio"

WORKDIR /app

# Instalar dependencias primero (cache layer)
COPY package*.json ./
RUN npm ci --only=production=false

# Copiar código fuente y build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
#  PRODUCTION (nginx)
# ─────────────────────────────────────────────
FROM nginx:alpine

LABEL org.opencontainers.image.title="Vulnerable Colegio - Frontend"
LABEL org.opencontainers.image.description="Plataforma de empleo técnico - Frontend React"
LABEL org.opencontainers.image.authors="Cristobal Montoya, Gino Monsalvez, Benjamin Ruiz"
LABEL org.opencontainers.image.source="https://github.com/GinoManBo/vulnerable-colegio"

# Copiar build estático
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar config de nginx optimizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
