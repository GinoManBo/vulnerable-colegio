# Despliegue Ultra-Rapido

> **Requisito previo:** Tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y abierto.

---

## Windows (CMD o PowerShell)

### Metodo 1: Un solo comando (Automatico)
Copia y pega esto en CMD o PowerShell:

```cmd
curl -fsSL https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/deploy.bat -o deploy.bat && deploy.bat
```

O si usas PowerShell:
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/deploy.bat" -OutFile "deploy.bat"; .\deploy.bat
```

Esto hace **TODO solo**:
1. Crea la carpeta `C:\Users\TuUsuario\vulnerable-colegio`
2. Descarga la configuracion
3. Descarga las imagenes desde Docker Hub
4. Levanta todo automaticamente

### Metodo 2: 3 comandos manuales
Si prefieres control total:

```cmd
:: 1. Crear carpeta y entrar
mkdir %USERPROFILE%\vulnerable-colegio && cd %USERPROFILE%\vulnerable-colegio

:: 2. Descargar configuracion
curl -fsSL https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/docker-compose.prod.yml -o docker-compose.yml

:: 3. Levantar todo
docker compose up -d
```

---

## Linux / macOS (Terminal)

### Metodo 1: Un solo comando (Automatico)
```bash
curl -fsSL https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/deploy.sh | bash
```

### Metodo 2: 3 comandos manuales
```bash
# 1. Crear carpeta y entrar
mkdir ~/vulnerable-colegio && cd ~/vulnerable-colegio

# 2. Descargar configuracion
curl -fsSL https://raw.githubusercontent.com/GinoManBo/vulnerable-colegio/main/docker-compose.prod.yml -o docker-compose.yml

# 3. Levantar todo
docker compose up -d
```

---

## Acceder a la aplicacion

Una vez ejecutado, abre tu navegador:

| Servicio | URL |
|----------|-----|
| **Aplicacion** | http://localhost |
| **API Backend** | http://localhost:5000/api |

**Credenciales de prueba (seed):**
- Admin: `admin@test.com` / `123456`
- Empresa: Cualquier empresa del seed / `123456`
- Estudiante: Cualquier estudiante del seed / `123456`

---

## Comandos utiles

| Accion | Windows (CMD) | Linux/macOS |
|--------|---------------|-------------|
| Ver logs | `docker compose logs -f` | `docker compose logs -f` |
| Detener todo | `docker compose down` | `docker compose down` |
| Reiniciar | `docker compose restart` | `docker compose restart` |
| Actualizar | `docker compose pull && docker compose up -d` | `docker compose pull && docker compose up -d` |

---

## Solucion de problemas

**"Docker no esta instalado"**
→ Instala Docker Desktop: https://www.docker.com/products/docker-desktop/

**"docker: command not found"**
→ Cierra y vuelve a abrir la terminal despues de instalar Docker.

**"Connection refused" al entrar a localhost**
→ Espera 30 segundos y recarga. MongoDB tarda en iniciar la primera vez.

**Puerto 80 o 5000 ocupado**
→ Edita el `docker-compose.yml` y cambia los puertos, por ejemplo:
```yaml
ports:
  - "8080:80"   # En vez de "80:80"
```
