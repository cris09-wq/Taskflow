<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequests } from '../composables/useRequests';
import { useRequestStatus } from '../composables/useRequestStatus';
import { useSocket } from '../composables/useSocket';
import { formatDate } from '../utils/formatDate';
import StatusBadge from '../components/Status/StatusBadge.vue';
import BaseButton from '../components/Buttons/BaseButton.vue';
import requestService from '../services/requestService';

const route = useRoute();
const router = useRouter();
const { solicitudSeleccionada, cargando, error, cargarSolicitud } = useRequests();
const { infoCategoria, infoPrioridad } = useRequestStatus();
const { on } = useSocket();

const cacheInfo = ref(null);
const eliminando = ref(false);

async function cargar() {
  const resultado = await cargarSolicitud(route.params.id);
  cacheInfo.value = resultado.cache;
}

// Actualiza la vista automáticamente cuando el evento corresponde a
// esta misma solicitud (HU-16: sin recargar el navegador).
function manejarEvento(solicitud) {
  if (solicitud && solicitud._id === route.params.id) {
    solicitudSeleccionada.value = { ...solicitudSeleccionada.value, ...solicitud };
  }
}

on('solicitud-encolada', manejarEvento);
on('solicitud-procesando', manejarEvento);
on('solicitud-respondida', manejarEvento);
on('solicitud-error', manejarEvento);
on('solicitud-actualizada', manejarEvento);

async function eliminar() {
  if (!confirm('¿Deseas eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
  eliminando.value = true;
  try {
    await requestService.eliminar(route.params.id);
    router.push({ name: 'solicitudes' });
  } catch (err) {
    alert(err.mensaje);
  } finally {
    eliminando.value = false;
  }
}

const categoriaLabel = computed(() =>
  solicitudSeleccionada.value ? infoCategoria(solicitudSeleccionada.value.categoria) : ''
);
const prioridadInfo = computed(() =>
  solicitudSeleccionada.value ? infoPrioridad(solicitudSeleccionada.value.prioridad) : { etiqueta: '', color: '' }
);

onMounted(cargar);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Detalle de solicitud</h1>
      <BaseButton variant="ghost" @click="router.push({ name: 'solicitudes' })">← Volver al listado</BaseButton>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="cargando" class="empty-state">Cargando solicitud...</p>

    <div v-else-if="solicitudSeleccionada" class="request-detail card">
      <div class="request-detail__header">
        <div>
          <h2>{{ solicitudSeleccionada.titulo }}</h2>
          <span class="request-detail__id">ID: {{ solicitudSeleccionada._id }}</span>
        </div>
        <div class="request-detail__badges">
          <StatusBadge :estado="solicitudSeleccionada.estado" />
          <span v-if="cacheInfo" class="cache-badge" :class="`cache-badge--${cacheInfo.toLowerCase()}`">
            {{ cacheInfo === 'HIT' ? 'CACHE HIT' : 'CACHE MISS' }}
          </span>
        </div>
      </div>

      <dl class="request-detail__grid">
        <div>
          <dt>Categoría</dt>
          <dd>{{ categoriaLabel }}</dd>
        </div>
        <div>
          <dt>Prioridad</dt>
          <dd>
            <span class="priority-dot" :style="{ backgroundColor: prioridadInfo.color }" />
            {{ prioridadInfo.etiqueta }}
          </dd>
        </div>
        <div>
          <dt>Fecha de creación</dt>
          <dd>{{ formatDate(solicitudSeleccionada.fechaCreacion || solicitudSeleccionada.createdAt) }}</dd>
        </div>
        <div>
          <dt>Fecha de procesamiento</dt>
          <dd>{{ formatDate(solicitudSeleccionada.fechaProcesamiento) }}</dd>
        </div>
      </dl>

      <div class="request-detail__section">
        <h3>Descripción</h3>
        <p>{{ solicitudSeleccionada.descripcion }}</p>
      </div>

      <div v-if="solicitudSeleccionada.estado === 'RESPONDIDA'" class="request-detail__section">
        <h3>Respuesta</h3>
        <p class="request-detail__respuesta">{{ solicitudSeleccionada.respuesta }}</p>
      </div>

      <div v-else-if="solicitudSeleccionada.estado === 'ERROR'" class="request-detail__section">
        <h3>Error</h3>
        <p class="alert alert-error">{{ solicitudSeleccionada.error || 'Ocurrió un error durante el procesamiento.' }}</p>
      </div>

      <div v-else class="request-detail__section">
        <p class="empty-state">
          Esta solicitud aún se encuentra en proceso. La respuesta aparecerá aquí automáticamente en cuanto esté disponible.
        </p>
      </div>

      <div class="request-detail__actions">
        <BaseButton variant="danger" :disabled="eliminando" @click="eliminar">
          {{ eliminando ? 'Eliminando...' : 'Eliminar solicitud' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.request-detail {
  padding: 24px;
}

.request-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 4px;
  }
}

.request-detail__id {
  font-family: monospace;
  font-size: 0.8rem;
  color: $color-text-muted;
}

.request-detail__badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cache-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.03em;

  &--hit {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
  }

  &--miss {
    background: rgba(245, 158, 11, 0.12);
    color: #b45309;
  }
}

.request-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin: 0 0 20px;

  dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: $color-text-muted;
    margin-bottom: 4px;
  }

  dd {
    margin: 0;
    font-weight: 600;
  }
}

.request-detail__section {
  margin-bottom: 20px;

  h3 {
    font-size: 0.95rem;
    margin: 0 0 8px;
  }

  p {
    margin: 0;
    line-height: 1.5;
  }
}

.request-detail__respuesta {
  background: $color-bg;
  border-radius: $radius-sm;
  padding: 14px;
  white-space: pre-line;
}

.priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.request-detail__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
