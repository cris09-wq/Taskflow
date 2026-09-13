# TASKFLOW

Sistema Full Stack para la gestión y procesamiento asíncrono de solicitudes.

**Stack:** Vue 3 · Node.js/Express · Socket.IO · MongoDB · Redis (caché + cola con BullMQ) · Worker Node.js · Docker Compose.

---

## 1. Arquitectura

```text
Usuario → Vue 3 → Express (REST + Socket.IO) → MongoDB / Redis
                                                     │
                                                     ▼
                                              Redis Queue → Worker → MongoDB
```

- El **frontend nunca se conecta directamente** a MongoDB ni a Redis; toda la comunicación pasa por Express.
- **Socket.IO** notifica al frontend en tiempo real los cambios de estado (`solicitud-creada`, `solicitud-encolada`, `solicitud-procesando`, `solicitud-respondida`, `solicitud-error`, `cola-actualizada`, `monitor-actualizado`).
- El **Worker** es un proceso Node.js independiente: consume la cola de Redis (BullMQ), procesa la solicitud, genera una respuesta según reglas por categoría y actualiza MongoDB. Como no tiene acceso al navegador, publica sus eventos en un canal Redis (pub/sub) que el backend retransmite por Socket.IO.
- MongoDB persiste mediante un **volumen Docker** (`mongo-data`), por lo que la información sobrevive a reinicios de los contenedores.

## 2. Estructura del repositorio

```text
taskflow/
├── docker-compose.yml
├── README.md
├── backend/     → API REST (Express) + Socket.IO
├── worker/      → Procesamiento asíncrono independiente
└── frontend/    → Aplicación Vue 3
```

Cada carpeta (`backend/`, `worker/`, `frontend/`) tiene su propio `package.json`, `Dockerfile` y `.env.example`.

### 2.1 Estructura del frontend

```text
frontend/src
├── assets/        # Recursos estáticos
├── components/    # Buttons, Tables, Headers, Status, StatCard, Requests
├── views/         # DashboardView, NewRequestView, RequestsView, RequestDetailView, MonitorView
├── composables/   # useRequests, useFetch, useRequestStatus, useSocket
├── store/         # requestStore.js (Pinia)
├── router/        # index.js
├── services/      # requestService.js (comunicación con Express)
├── layouts/       # MainLayout.vue
├── styles/        # variables.scss, main.scss
├── plugins/       # axios.js, socket.js
├── utils/         # formatDate.js, validateRequest.js
├── App.vue
└── main.js
```

### 2.2 Estructura del backend

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

## 3. API REST

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/solicitudes` | Listar solicitudes (filtros: `q`, `categoria`, `estado`, `prioridad`) |
| GET | `/api/solicitudes/:id` | Consultar una solicitud (usa caché Redis, header `X-Cache: HIT/MISS`) |
| POST | `/api/solicitudes` | Registrar una solicitud (la envía a la cola automáticamente) |
| PUT | `/api/solicitudes/:id` | Actualizar título, descripción, categoría o prioridad |
| DELETE | `/api/solicitudes/:id` | Eliminar una solicitud |
| GET | `/api/solicitudes/estadisticas/resumen` | Estadísticas para el Dashboard |
| GET | `/api/monitor` | Estado de los servicios (Express, MongoDB, Redis, Worker) y contadores de cola |

## 4. Ejecución con Docker Compose (recomendado)

**Requisito:** Docker y Docker Compose instalados.

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd taskflow

# 2. Levantar todos los servicios con un solo comando
docker compose up --build
```

Esto construye e inicia los **5 servicios**: `frontend`, `backend`, `worker`, `mongoserver`, `redisserver`.

### Puertos publicados al equipo anfitrión

| Servicio | Puerto host | URL |
|---|---|---|
| Frontend (Vue) | 8080 | http://localhost:8080 |
| Backend (API) | 4000 | http://localhost:4000/api |
| MongoDB | 27017 | mongodb://localhost:27017 (opcional, para depuración) |
| Redis | 6379 | redis://localhost:6379 (opcional, para depuración) |

Para detener todo el entorno:

```bash
docker compose down
```

Para detener y **también borrar** los datos de MongoDB (reinicia el volumen):

```bash
docker compose down -v
```

### Demostrar persistencia (HU-10)

```bash
# Registrar una solicitud desde la interfaz (http://localhost:8080)
docker compose restart mongoserver backend worker
# Refrescar el listado en Vue: la solicitud sigue apareciendo
```

### Demostrar el comportamiento de la cola (HU-04)

```bash
docker compose stop worker
# Registrar varias solicitudes desde Vue: quedan en estado "EN COLA"
docker compose start worker
# El Worker las procesa automáticamente una a una
```

### Demostrar CACHE HIT / CACHE MISS (HU-08)

Consulta el detalle de una solicitud dos veces seguidas y observa el badge junto al estado:
la primera consulta muestra `CACHE MISS` (se leyó de MongoDB) y la segunda `CACHE HIT`
(se leyó de Redis), dentro del tiempo de vida configurado (`CACHE_TTL`, 60s por defecto).

## 5. Ejecución en modo desarrollo (sin Docker)

Requiere tener MongoDB y Redis corriendo localmente (o mediante Docker solo para esos dos servicios).

```bash
# Servicios de infraestructura únicamente
docker compose up -d mongoserver redisserver

# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:4000

# Worker (en otra terminal)
cd worker
cp .env.example .env
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev           # http://localhost:5173
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
# Clonar
git clone <url-del-repositorio>
cd taskflow

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

## 9. Reto final de integración

Escenario completo a demostrar (ver sección 24 del enunciado del taller):

1. Registrar una solicitud desde Vue.
2. Verificar su paso por `EN COLA → PROCESANDO → RESPONDIDA` en tiempo real (sin recargar).
3. Consultar su detalle dos veces y observar `CACHE MISS` → `CACHE HIT`.
4. Detener el Worker, registrar nuevas solicitudes y comprobar que permanecen `EN COLA`.
5. Reiniciar el Worker y comprobar que procesa las solicitudes pendientes.
6. Reiniciar los contenedores y comprobar que toda la información persiste (MongoDB + volumen Docker).
