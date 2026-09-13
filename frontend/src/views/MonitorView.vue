<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useSocket } from '../composables/useSocket';
import requestService from '../services/requestService';

const monitor = ref({
  servicios: { express: false, mongodb: false, redis: false, worker: false },
  cola: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
  solicitudes: { total: 0, PENDIENTE: 0, EN_COLA: 0, PROCESANDO: 0, RESPONDIDA: 0, ERROR: 0 }
});
const cargando = ref(true);
const error = ref(null);
let intervalo = null;

const { on } = useSocket();

async function cargarMonitor() {
  try {
    const respuesta = await requestService.obtenerMonitor();
    monitor.value = respuesta.datos;
    error.value = null;
  } catch (err) {
    error.value = err.mensaje || 'No fue posible consultar el estado del sistema.';
  } finally {
    cargando.value = false;
  }
}

// El Monitor se refresca automáticamente mediante Socket.IO ante cualquier
// cambio de estado, y adicionalmente mediante polling como respaldo.
on('solicitud-creada', cargarMonitor);
on('solicitud-encolada', cargarMonitor);
on('solicitud-procesando', cargarMonitor);
on('solicitud-respondida', cargarMonitor);
on('solicitud-error', cargarMonitor);
on('cola-actualizada', cargarMonitor);
on('monitor-actualizado', cargarMonitor);

onMounted(() => {
  cargarMonitor();
  intervalo = setInterval(cargarMonitor, 8000);
});

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo);
});

const servicios = [
  { clave: 'express', etiqueta: 'Express (API)' },
  { clave: 'mongodb', etiqueta: 'MongoDB' },
  { clave: 'redis', etiqueta: 'Redis' },
  { clave: 'worker', etiqueta: 'Worker' }
];
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Monitor de procesamiento</h1>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div class="card monitor-services">
      <div v-for="servicio in servicios" :key="servicio.clave" class="monitor-services__item">
        <span
          class="monitor-services__dot"
          :class="monitor.servicios[servicio.clave] ? 'monitor-services__dot--ok' : 'monitor-services__dot--down'"
        />
        <span class="monitor-services__label">{{ servicio.etiqueta }}</span>
        <span class="monitor-services__state" :class="{ 'monitor-services__state--down': !monitor.servicios[servicio.clave] }">
          {{ monitor.servicios[servicio.clave] ? 'Disponible' : 'No disponible' }}
        </span>
      </div>
    </div>

    <h2 class="section-title">Cola de procesamiento (Redis)</h2>
    <div class="grid-stats">
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.cola.waiting }}</span>
        <span class="monitor-metric__etiqueta">En espera</span>
      </div>
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.cola.active }}</span>
        <span class="monitor-metric__etiqueta">Activos</span>
      </div>
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.cola.completed }}</span>
        <span class="monitor-metric__etiqueta">Completados</span>
      </div>
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.cola.failed }}</span>
        <span class="monitor-metric__etiqueta">Fallidos</span>
      </div>
    </div>

    <h2 class="section-title">Solicitudes (MongoDB)</h2>
    <div class="grid-stats">
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.solicitudes.EN_COLA }}</span>
        <span class="monitor-metric__etiqueta">En cola</span>
      </div>
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.solicitudes.PROCESANDO }}</span>
        <span class="monitor-metric__etiqueta">Procesando</span>
      </div>
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.solicitudes.RESPONDIDA }}</span>
        <span class="monitor-metric__etiqueta">Respondidas</span>
      </div>
      <div class="card monitor-metric">
        <span class="monitor-metric__valor">{{ monitor.solicitudes.ERROR }}</span>
        <span class="monitor-metric__etiqueta">Errores</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.section-title {
  font-size: 1.05rem;
  margin: 8px 0 12px;
}

.monitor-services {
  padding: 8px;
  margin-bottom: 24px;
}

.monitor-services__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.monitor-services__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &--ok {
    background: $color-respondida;
  }

  &--down {
    background: $color-error;
  }
}

.monitor-services__label {
  font-weight: 600;
  flex: 1;
}

.monitor-services__state {
  color: $color-respondida;
  font-size: 0.85rem;
  font-weight: 600;

  &--down {
    color: $color-error;
  }
}

.monitor-metric {
  padding: 18px;
  text-align: center;
}

.monitor-metric__valor {
  display: block;
  font-size: 1.6rem;
  font-weight: 700;
}

.monitor-metric__etiqueta {
  font-size: 0.8rem;
  color: $color-text-muted;
}
</style>
