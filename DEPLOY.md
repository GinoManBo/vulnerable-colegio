# Guía de Deploy en Producción

## Estructura del deploy (todo en un servidor)

Este proyecto usa **monorepo**: frontend (React + Vite) y backend (Express + MongoDB) en el mismo servidor.

---

## Requisitos en el servidor

- Node.js 18+
- npm
- MongoDB Atlas (recomendado) o MongoDB local

---

## Pasos para deploy

### 1. Clonar el proyecto

```bash
git clone <tu-repositorio>
cd vulnerable-colegio
```

### 2. Instalar dependencias

```bash
# Dependencias del frontend
npm install

# Dependencias del backend
cd backend && npm install && cd ..
```

### 3. Configurar variables de entorno

#### Backend (`backend/.env`)

Crea el archivo `backend/.env`:

```env
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/vulnerable-colegio
JWT_SECRET=tu_secreto_super_seguro_aqui
PORT=5000
CLIENT_URL=https://tu-dominio.com
NODE_ENV=production
```

> **IMPORTANTE**: Genera un `JWT_SECRET` largo y aleatorio para producción.

#### Frontend (`src/.env`)

**Dejar vacío o no crear**. El frontend detecta automáticamente el entorno:
- En localhost usa `http://localhost:5000/api`
- En producción usa `/api` (mismo dominio)

Si necesitas una URL específica del backend, crea `src/.env`:
```env
VITE_API_URL=https://tu-dominio.com/api
```

### 4. Compilar el frontend

```bash
npm run build
```

Esto crea la carpeta `dist/` con los archivos estáticos optimizados.

### 5. Iniciar el servidor

```bash
cd backend && npm start
```

O desde la raíz:
```bash
npm start
```

El backend ahora:
- Sirve la API en `https://tu-dominio.com/api`
- Sirve el frontend en `https://tu-dominio.com`
- Redirige cualquier ruta del frontend a `index.html` (SPA)

---

## ¿Por qué daba error 404 antes?

### Causa
El frontend compilado estaba intentando conectar a:
- `http://localhost:5000/api` → Solo funciona en tu computadora local
- El backend no servía los archivos estáticos del frontend

### Soluciones aplicadas
1. **CORS flexible**: El backend ahora acepta múltiples orígenes y cualquier origin en producción
2. **Auto-detección de API URL**: El frontend detecta si está en localhost o producción
3. **Static files**: Express sirve la carpeta `dist/` como archivos estáticos
4. **SPA routing**: Cualquier ruta que no sea `/api/*` redirige a `index.html`

---

## Servicios recomendados para hosting gratuito

### Todo en uno (más fácil)
- **Railway** / **Render**: Soportan monorepos
- **DigitalOcean App Platform**

### Separado (frontend + backend)
- Frontend: **Vercel** o **Netlify**
- Backend: **Render**, **Railway**, o **Fly.io**

En ese caso, configura:
- `VITE_API_URL=https://tu-api.com/api` en el frontend
- `CLIENT_URL=https://tu-frontend.com` en el backend

---

## Verificar que todo funciona

1. Abre tu dominio en el navegador
2. Deberías ver la página de inicio cargada
3. Intenta iniciar sesión → debería funcionar sin errores 404
4. Navega a `/mis-postulaciones` y refresca → no debería dar 404

---

## Troubleshooting

### "Load Failed" / "Failed to fetch"
- Verifica que `VITE_API_URL` esté vacío o apunte al dominio correcto
- Revisa la consola del navegador (F12 → Network) para ver qué URL está intentando cargar

### Error CORS
- Verifica que `CLIENT_URL` en el backend incluya tu dominio
- En producción (`NODE_ENV=production`), el CORS permite cualquier origin

### 404 al refrescar una página
- Asegúrate de que el backend esté sirviendo `dist/index.html` para rutas no-API
- Verifica que exista la carpeta `dist/` después de correr `npm run build`
