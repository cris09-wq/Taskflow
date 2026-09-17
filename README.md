# TASKFLOW · Frontend

Aplicación web **Vue 3** para el sistema TaskFlow de gestión y procesamiento
asíncrono de solicitudes.

**Stack:** Vue 3 · Vite · Pinia · Vue Router · Axios · Socket.IO client · SCSS.

> Esta rama corresponde **solo al frontend**. El backend (API REST + Socket.IO
> + Worker + Redis) vive en la rama `backend` del mismo repositorio y debe
> estar levantado para que la aplicación funcione de extremo a extremo.

---

## 1. Arquitectura

```text
Usuario → Vue 3 (esta rama) → Express (rama backend, REST + Socket.IO) → MongoDB / Redis
```

- El **frontend nunca se conecta directamente** a MongoDB ni a Redis; toda la
  comunicación pasa por Express (rama `backend`).
- **Socket.IO** notifica a esta aplicación en tiempo real los cambios de estado
  (`solicitud-creada`, `solicitud-encolada`, `solicitud-procesando`,
  `solicitud-respondida`, `solicitud-error`, `cola-actualizada`,
  `monitor-actualizado`).

## 2. Estructura del repositorio

```text
taskflow/ (rama frontend)
├── docker-compose.yml
├── README.md
└── frontend/     → Aplicación Vue 3
```

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

Además, `frontend/` incluye:

- `vite.config.js` — configuración de Vite (puerto 5173 en desarrollo).
- `Dockerfile` — build con Vite y servido estático con Nginx (2 etapas).
- `nginx.conf` — configuración del servidor Nginx.
- `.env.example` — variables de entorno del frontend.

## 3. Variables de entorno

Copiar `.env.example` a `.env` (opcional en desarrollo; el Dockerfile usa valores por defecto):

```bash
cd frontend
cp .env.example .env
```

| Variable | Uso | Default |
|---|---|---|
| `VITE_API_URL` | URL base de la API REST (visible desde el navegador) | `http://localhost:4000/api` |
| `VITE_SOCKET_URL` | URL del servidor Socket.IO | `http://localhost:4000` |

> Estas URLs las consume el **navegador**, por eso usan `localhost` + puerto
> publicado, no el nombre del servicio Docker.

## 4. Ejecución en modo desarrollo

**Requisito:** el backend (rama `backend` del repositorio) debe estar corriendo.

```bash
# 1. Clonar el repositorio (rama frontend)
git clone <url-del-repositorio>
cd taskflow
git checkout frontend

# 2. Instalar dependencias y levantar Vite
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Para crear el build de producción:

```bash
cd frontend
npm run build             # genera la carpeta dist/
```

## 5. Ejecución con Docker (solo frontend)

**Requisito:** Docker y Docker Compose instalados, y el backend (rama `backend`) corriendo.

```bash
docker compose up --build
```

Esto construye y sirve la aplicación Vue con Nginx en http://localhost:8080.

Para detener:

```bash
docker compose down
```

> Este compose solo levanta el `frontend`. La API, Redis y el Worker se
> levantan por separado desde la rama `backend` (`docker compose up --build`).

## 6. Estados de una solicitud (mostrados por la UI)

```text
PENDIENTE → EN_COLA → PROCESANDO → RESPONDIDA
                            │
                            └──→ ERROR
```

> Nota técnica: internamente se usa `EN_COLA` (sin espacio) como valor de
> estado; la interfaz lo muestra como "En cola".

## 7. Categorías de solicitud

| Categoría (valor interno) | Etiqueta |
|---|---|
| `informacion` | Información |
| `soporte` | Soporte |
| `documento` | Documento |
| `consulta` | Consulta |
| `actualizacion` | Actualización |

## 8. Vistas de la aplicación

| Ruta | Vista | Función |
|---|---|---|
| `/` | `DashboardView` | Estadísticas y resumen de solicitudes |
| `/solicitudes` | `RequestsView` | Listado con filtros (búsqueda, categoría, estado, prioridad) |
| `/solicitudes/nueva` | `NewRequestView` | Registro de una solicitud |
| `/solicitudes/:id` | `RequestDetailView` | Detalle, caché y actualización |
| `/monitor` | `MonitorView` | Estado de los servicios (Express, MongoDB, Redis, Worker) |

## 9. Flujo de trabajo Git / GitHub (HU-15)

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
# Clonar (rama frontend)
git clone <url-del-repositorio>
cd taskflow
git checkout frontend

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

## 10. Nota sobre el backend

La API REST, Socket.IO, Redis (cola + caché), el Worker y MongoDB Atlas viven
en la **rama `backend`** del repositorio. Para que esta aplicación funcione
completa, asegúrate de que el backend esté levantado y que `VITE_API_URL` /
`VITE_SOCKET_URL` apunten a él.