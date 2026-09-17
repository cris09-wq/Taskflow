# TASKFLOW · Backend

API REST + Socket.IO para el sistema TaskFlow de gestión y procesamiento
asíncrono de solicitudes.

**Stack:** Node.js/Express · Socket.IO · MongoDB Atlas · Redis (caché + cola con BullMQ) · Worker Node.js · Docker Compose.

> Esta rama corresponde **solo al backend**. El frontend (Vue 3) vive en la
> rama `frontend` del mismo repositorio y se ejecuta por separado contra esta API.

---

## 1. Arquitectura

```text
Cliente (frontend / API) → Express (REST + Socket.IO) → MongoDB / Redis
                                                                │
                                                                ▼
                                                         Redis Queue → Worker → MongoDB
```

- El **frontend nunca se conecta directamente** a MongoDB ni a Redis; toda la comunicación pasa por Express.
- **Socket.IO** notifica al frontend en tiempo real los cambios de estado (`solicitud-creada`, `solicitud-encolada`, `solicitud-procesando`, `solicitud-respondida`, `solicitud-error`, `cola-actualizada`, `monitor-actualizado`).
- El **Worker** es un proceso Node.js independiente: consume la cola de Redis (BullMQ), procesa la solicitud, genera una respuesta según reglas por categoría y actualiza MongoDB. Como no tiene acceso al navegador, publica sus eventos en un canal Redis (pub/sub) que el backend retransmite por Socket.IO.
- MongoDB está en la **nube (MongoDB Atlas)**: la conexión se define con la variable `MONGO_URI` (ver sección 5), por lo que la información sobrevive a reinicios o recreaciones de los contenedores y no depende de un volumen local.

## 2. Estructura del repositorio

```text
taskflow/ (rama backend)
├── docker-compose.yml
├── README.md
├── backend/     → API REST (Express) + Socket.IO
└── worker/      → Procesamiento asíncrono independiente
```

Cada carpeta (`backend/`, `worker/`) tiene su propio `package.json`, `Dockerfile` y `.env.example`.

### 2.1 Estructura del backend

```text
backend/src
├── routes/        # solicitudes.routes.js, monitor.routes.js
├── controllers/    # solicitudes.controller.js, monitor.controller.js
├── services/       # solicitudes.service.js, cache.service.js, queue.service.js
├── models/         # Solicitud.js (Mongoose)
├── middlewares/     # validateRequest.js, errorHandler.js
├── config/          # db.js, redis.js, socket.js
└── app.js / server.js
```

### 2.2 Estructura del worker

```text
worker/src
├── config/        # db.js, redis.js
├── models/        # Solicitud.js (Mongoose)
├── processors/    # solicitudProcessor.js
├── rules/         # responseRules.js (plantillas por categoría)
├── utils/         # cache.js, events.js (pub/sub a Redis)
└── index.js
```

## 3. API REST

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/solicitudes` | Listar solicitudes (filtros: `q`, `categoria`, `estado`, `prioridad`) |
| GET | `/api/solicitudes/:id` | Consultar una solicitud (usa caché Redis, header `X-Cache: HIT/MISS`) |
| POST | `/api/solicitudes` | Registrar una solicitud (la envía a la cola automáticamente) |
| PUT | `/api/solicitudes/:id` | Actualizar título, descripción, categoría o prioridad |
| PATCH | `/api/solicitudes/:id/desactivar` | Desactivar una solicitud (no se elimina; sus datos se conservan) |
| GET | `/api/solicitudes/estadisticas/resumen` | Estadísticas para el Dashboard |
| GET | `/api/monitor` | Estado de los servicios (Express, MongoDB, Redis, Worker) y contadores de cola |

## 4. Ejecución con Docker Compose (recomendado)

**Requisito:** Docker y Docker Compose instalados.

```bash
# 1. Clonar el repositorio (rama backend)
git clone <url-del-repositorio>
cd taskflow
git checkout backend

# 2. Levantar todos los servicios del backend con un solo comando
docker compose up --build
```

Esto construye e inicia los **3 servicios**: `backend`, `worker` y `redisserver`. MongoDB no se levanta localmente: se usa MongoDB Atlas (variable `MONGO_URI`).

### Puertos publicados al equipo anfitrión

| Servicio | Puerto host | URL |
|---|---|---|
| Backend (API) | 4000 | http://localhost:4000/api |
| Redis | 6379 | redis://localhost:6379 (opcional, para depuración) |

Para detener todo el entorno:

```bash
docker compose down
```

Para detener y **también borrar** los datos locales de Redis:

```bash
docker compose down -v
```

> Los datos de MongoDB NO se borran con `-v`: viven en MongoDB Atlas (nube).

### Demostrar persistencia (HU-10)

```bash
docker compose restart backend worker
# Registrar/consultar con el cliente API: los datos persisten en MongoDB Atlas
```

### Demostrar el comportamiento de la cola (HU-04)

```bash
docker compose stop worker
# Registrar solicitudes (POST /api/solicitudes): quedan en estado "EN COLA"
docker compose start worker
# El Worker las procesa automáticamente una a una
```

### Demostrar CACHE HIT / CACHE MISS (HU-08)

Consulta el detalle de una solicitud (GET `/api/solicitudes/:id`) dos veces
seguidas y observa el header `X-Cache`: la primera consulta devuelve
`CACHE MISS` (se leyó de MongoDB) y la segunda `CACHE HIT` (se leyó de
Redis), dentro del tiempo de vida configurado (`CACHE_TTL`, 60s por defecto).

## 5. Ejecución en modo desarrollo (sin Docker)

Requiere MongoDB Atlas configurado y el conector de MongoDB corriendo localmente (solo Redis).

### 5.1 Configurar MongoDB Atlas (una sola vez)

1. Crear un clúster gratuito (M0) en https://www.mongodb.com/atlas.
2. Crear un **usuario de base de datos** (Database Access) con rol `readWrite`.
3. Añadir tu IP en **Network Access** (`0.0.0.0/0` solo para desarrollo).
4. En **Connect > Drivers**, copiar el connection string `mongodb+srv://...`.
5. En `backend/.env` y `worker/.env`, pegar ese string en `MONGO_URI` usando el nombre de base de datos `taskflow`:
   ```
   mongodb+srv://<usuario>:<contrasena>@<cluster>.mongodb.net/taskflow
   ```
6. Si la contraseña contiene `@`, `:`, `/` o `?`, debe estar **URL-encodeada** en el string.

### 5.2 Levantar los servicios

```bash
# Redis (infraestructura local)
docker compose up -d redisserver

# Backend
cd backend
cp .env.example .env      # y reemplazar MONGO_URI por tu string de Atlas
npm install
npm run dev               # http://localhost:4000

# Worker (en otra terminal)
cd worker
cp .env.example .env      # y reemplazar MONGO_URI por tu string de Atlas
npm install
npm run dev
```

## 6. Estados de una solicitud

```text
PENDIENTE → EN_COLA → PROCESANDO → RESPONDIDA
                            │
                            └──→ ERROR
```

> Nota técnica: internamente se usa `EN_COLA` (sin espacio) como valor de
> estado; la interfaz lo muestra como "En cola".

## 7. Categorías y reglas de respuesta

| Categoría (valor interno) | Etiqueta |
|---|---|
| `informacion` | Información |
| `soporte` | Soporte |
| `documento` | Documento |
| `consulta` | Consulta |
| `actualizacion` | Actualización |

Cada categoría tiene una plantilla de respuesta predefinida (`worker/src/rules/responseRules.js`).
Si la categoría no coincide con ninguna regla, se utiliza una respuesta genérica.

> Para simular un error controlado (HU-11), registra una solicitud cuya
> descripción contenga la palabra `forzar-error`; el Worker la marcará
> deliberadamente en estado `ERROR`.

## 8. Flujo de trabajo Git / GitHub (HU-15)

```text
Issue → GitHub Project → Branch → Development → Commit → Push →
Pull Request → Code Review → Correcciones → Merge → Cerrar Issue
```

### Convención de ramas sugerida

```text
main                    # Rama protegida - solo vía Pull Request aprobado
├── feature/hu-01-registrar-solicitud
├── feature/hu-04-cola-redis
├── feature/hu-08-cache-redis
├── feature/hu-16-socketio
└── fix/...
```

### Comandos Git básicos

```bash
# Clonar (rama backend)
git clone <url-del-repositorio>
cd taskflow
git checkout backend

# Crear una rama de funcionalidad
git checkout -b feature/hu-01-registrar-solicitud

# Registrar cambios
git add .
git commit -m "feat(hu-01): implementar registro de solicitudes"

# Subir la rama
git push origin feature/hu-01-registrar-solicitud

# Abrir Pull Request hacia main desde GitHub,
# solicitar revisión de código a un compañero,
# atender comentarios, y hacer merge una vez aprobado.

# Mantener la rama local actualizada con main
git checkout main
git pull origin main
git checkout feature/hu-01-registrar-solicitud
git merge main
```

Cada Historia de Usuario (HU) debe registrarse como **Issue**, organizarse en
**GitHub Projects**, y su desarrollo debe asociarse a una rama, uno o más
commits, un Pull Request y al menos una revisión de código antes de integrarse
a la rama principal.