# Centro Educacional Cardenal José María Caro — Plataforma de Empleo Técnico

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)](https://mongodb.com)

Plataforma web para conectar egresados técnicos del Bío-Bío con empresas que buscan talento. Incluye publicación de ofertas, postulaciones, chat privado y grupal, panel de administración, aprobación de perfiles y auditoría completa.

---

## Características principales

- **Tres roles de usuario**: Estudiante, Empresa y Administrador
- **Ofertas de empleo**: Publicación con salario, modalidad, especialidades y fecha de cierre
- **Postulaciones**: Estados visibles (Pendiente, En revisión, Aceptada, Rechazada, Contratada)
- **Chat en tiempo real**: Mensajes privados y grupales automáticos por oferta
- **Aprobación de perfiles**: Moderación de CVs y datos de perfil por parte de admin
- **Notificaciones**: Alertas en plataforma sobre postulaciones y mensajes
- **Panel de administración**: Estadísticas, auditoría, gestión de usuarios y ofertas
- **Historial de trabajo**: Seguimiento de contrataciones y calificaciones

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Express 5 + Node.js (ES Modules) |
| Base de datos | MongoDB + Mongoose 9 |
| Autenticación | JWT + bcryptjs |
| Archivos | Multer (CVs PDF, fotos/logos) |

---

## Galería

### Panel de Administrador
![Panel Admin](docs/screenshots/panel-admin.png)
*Gestión de usuarios, auditoría, aprobación de perfiles y estadísticas*

### Portal Empresa — Publicar Oferta
![Portal Empresa — Formulario](docs/screenshots/portal-empresa-formulario.png)
*Formulario para crear una nueva oferta de empleo*

### Portal Empresa — Listado de Postulantes
![Portal Empresa — Postulantes](docs/screenshots/portal-empresa-postulantes.png)
*Vista de postulantes con estados y acciones*

### Vista Estudiante — Feed de Ofertas
![Vista Estudiante](docs/screenshots/vista-estudiante.png)
*Listado de ofertas disponibles con filtros y postulación en un clic*

### Chat Grupal por Oferta
![Chat Grupal](docs/screenshots/chat-grupal.png)
*Chat automático creado al aceptar un postulante*

> **Nota**: Las capturas de pantalla deben colocarse en la carpeta `docs/screenshots/` para que los enlaces funcionen correctamente.

---

## Instalación

```bash
# 1. Clonar
git clone <repo-url>
cd vulnerable-colegio

# 2. Frontend
npm install

# 3. Backend
cd backend && npm install

# 4. Variables de entorno
cp backend/.env.example backend/.env
# Editar: MONGO_URI, JWT_SECRET, PORT, CLIENT_URL

# 5. Poblar base de datos (opcional)
cd backend && npm run seed
```

---

## Ejecución

```bash
# Desarrollo frontend (http://localhost:5173)
npm run dev

# Desarrollo backend (http://localhost:5000)
cd backend && npm run dev

# Producción (build + servidor)
npm start
```

---

## Variables de entorno

**Backend (`backend/.env`)**
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=tu_secreto_jwt
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (`src/.env` — opcional)**
```env
VITE_API_URL=http://localhost:5000/api
# Dejar vacío para auto-detección
```

---

## Datos de prueba (seed)

El script `backend/seed.js` crea:
- 1 administrador
- 20 estudiantes
- 10 empresas
- 20 ofertas de empleo

**Credenciales de prueba**: Todas las contraseñas son `123456`.

---

## Estructura del proyecto

```
├── src/               # Frontend React
│   ├── pages/         # Vistas principales
│   ├── components/    # Componentes reutilizables
│   └── api.js         # Cliente API
├── backend/           # Servidor Express
│   ├── index.js       # Rutas API
│   ├── models/        # Esquemas Mongoose
│   └── seed.js        # Datos de prueba
├── dist/              # Build de producción
├── uploads/           # Archivos subidos
└── docs/              # Documentación y screenshots
    └── screenshots/   # Capturas de pantalla para README
```

---

## Autores

- **Cristóbal Montoya**
- **Gino Monsálvez**
- **Benjamín Ruiz**

Estudiantes de **Ingeniería en Informática**  
[Universidad del Desarrollo](https://www.udd.cl) — Sede Concepción

---

## Despliegue

Ver [DEPLOY.md](DEPLOY.md) para guía de despliegue en producción con Docker y MongoDB Atlas.
