# 🗄️ Configuración de Base de Datos - MongoDB Atlas

## ¿Qué es MongoDB Atlas?
MongoDB Atlas es una plataforma de base de datos en la nube completamente administrada. Ofrece una capa gratuita perfecta para desarrollo con 512MB de almacenamiento.

---

## 📋 Pasos para Configurar MongoDB Atlas

### 1. Crear cuenta en MongoDB Atlas
1. Ve a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Haz clic en **"Try Free"**
3. Completa el registro (email, contraseña, aceptar términos)
4. Selecciona **"Database"** como opción

### 2. Crear un Cluster
1. Haz clic en **"Create"**
2. Selecciona **"Free"** (M0 - Shared Cluster)
3. Elige una región cercana (ej: AWS - **us-east-1** o **sa-east-1** para Latinoamérica)
4. Haz clic en **"Create Cluster"**
5. Espera 3-5 minutos hasta que se cree el cluster

### 3. Crear Usuario de Base de Datos
1. En el panel, haz clic en **"Database Access"** (en la izquierda)
2. Haz clic en **"Add New Database User"**
3. Completa:
   - **Username:** `vulnerable-colegio`
   - **Password:** Crea una contraseña fuerte (guárdala)
   - **Built-in Role:** `readWriteAnyDatabase`
4. Haz clic en **"Add User"**

### 4. Configurar Network Access
1. Haz clic en **"Network Access"** (en la izquierda)
2. Haz clic en **"Add IP Address"**
3. Selecciona **"Allow access from anywhere"** (0.0.0.0/0)
4. Haz clic en **"Confirm"**

### 5. Obtener Connection String
1. Ve a **"Clusters"** y haz clic en **"Connect"**
2. Selecciona **"Connect with MongoDB Drivers"**
3. Elige **Node.js** versión **4.x**
4. Copia la connection string que parece así:
   ```
   mongodb+srv://vulnerable-colegio:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Reemplaza** `PASSWORD` con la contraseña que creaste

### 6. Actualizar `.env`
1. Abre `backend/.env`
2. Reemplaza:
   ```env
   MONGO_URI=mongodb+srv://vulnerable-colegio:TU_CONTRASEÑA@cluster0.xxxxx.mongodb.net/vulnerable-colegio?retryWrites=true&w=majority
   ```

---

## 🚀 Inicializar la Base de Datos

Una vez configurada la conexión, inicializa los datos de prueba:

```bash
cd backend
npm run seed
```

Esto creará:
- ✅ 3 estudiantes de prueba
- ✅ 3 empresas de prueba  
- ✅ 5 ofertas de empleo

### Credenciales de Prueba:
```
Estudiante:
  Email: juan@example.com
  Contraseña: 123456

Empresa:
  Email: rrhh@cmpc.cl
  Contraseña: 123456
```

---

## ✅ Verificar Conexión

```bash
# Inicia el servidor
npm start

# Deberías ver:
# ✓ Servidor corriendo en http://localhost:5000
# ✓ API disponible en http://localhost:5000/api
# ✓ MongoDB conectado correctamente
```

---

## 📊 Ver Datos en MongoDB Atlas

1. Ve a **"Clusters"**
2. Haz clic en **"Browse Collections"**
3. Verás las colecciones:
   - `users` - Usuarios (estudiantes, empresas, admin)
   - `perfilestudiantes` - Perfiles de estudiantes
   - `perfilempresa` - Perfiles de empresas
   - `publicacionempleos` - Ofertas de empleo
   - `postulaciones` - Postulaciones a ofertas
   - `preguntaempleos` - Preguntas en ofertas
   - `conversacions` - Conversaciones entre usuarios
   - `mensajes` - Mensajes

---

## 🔒 Seguridad

- ✅ Las contraseñas están hasheadas con bcryptjs
- ⚠️ En producción, usa variables de entorno para secretos
- ⚠️ No compartas tu `.env` en GitHub
- ⚠️ Usa IP whitelist más restrictiva en producción

---

## 📌 Notas Importantes

- **Capa Gratuita**: 512MB almacenamiento, 512MB RAM
- **Suficiente para desarrollo** con miles de registros
- **No necesita MC instalado localmente**
- **Automáticamente escalable** si creces

---

## 🆘 Problemas Comunes

### "MongoDB connection refused"
- Verifica que la IP esté en Network Access whitelist
- Verifica que el usuario y contraseña sean correctos
- Espera 1 minuto después de crear el cluster

### "AuthenticationFailed"
- Verifica que el username y password en `.env` sean correctos
- Los caracteres especiales deben estar URL encoded
- Si tu contraseña tiene `@`, reemplázalo con `%40`

### "Cannot connect to MongoDB"
- Verifica que MONGO_URI no esté comentado en `.env`
- Verifica que NODE_ENV sea "development"

---

## 📚 Referencias

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Mongoose Connection Guide](https://mongoosejs.com/docs/connections.html)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
