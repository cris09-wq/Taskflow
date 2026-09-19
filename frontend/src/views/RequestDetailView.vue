<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
const desactivando = ref(false);
const mostrarConfirmacion = ref(false);
const mensajeExito = ref(null);
const mensajeError = ref(null);
const POLL_INTERVAL_MS = 2000;
let temporizadorSondeo = null;

const ESTADOS_TERMINALES = ['RESPONDIDA', 'ERROR'];

async function cargar() {
  const resultado = await cargarSolicitud(route.params.id);
  cacheInfo.value = resultado.cache;
}

// Respaldo a Socket.IO: mientras la solicitud no haya terminado, se refresca
// periódicamente desde la API para que la respuesta aparezca aunque el evento
// en tiempo real no llegue (por ejemplo, por CORS o reconexión del socket).
function sondeo() {
  detenerSondeo();
  temporizadorSondeo = setInterval(async () => {
    const estado = solicitudSeleccionada.value?.estado;
    if (!estado || ESTADOS_TERMINALES.includes(estado)) {
      detenerSondeo();
      return;
    }
    try {
      const respuesta = await requestService.obtener(route.params.id);
      if (respuesta.datos) {
        solicitudSeleccionada.value = respuesta.datos;
      }
    } catch {
      // Se ignora: el siguiente ciclo reintentará.
    }
  }, POLL_INTERVAL_MS);
}

function detenerSondeo() {
  if (temporizadorSondeo) {
    clearInterval(temporizadorSondeo);
    temporizadorSondeo = null;
  }
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

function desactivar() {
  mensajeError.value = null;
  mostrarConfirmacion.value = true;
}

function cancelarDesactivacion() {
  if (desactivando.value) return;
  mostrarConfirmacion.value = false;
}

async function confirmarDesactivacion() {
  desactivando.value = true;
  mensajeError.value = null;
  try {
    await requestService.desactivar(route.params.id);
    mostrarConfirmacion.value = false;
    mensajeExito.value = 'La solicitud fue desactivada. Sus datos se conservan en el sistema.';
    router.push({ name: 'solicitudes' });
  } catch (err) {
    mensajeError.value = err.mensaje || 'No fue posible desactivar la solicitud. Inténtalo nuevamente.';
    mostrarConfirmacion.value = false;
  } finally {
    desactivando.value = false;
  }
}

const categoriaLabel = computed(() =>
  solicitudSeleccionada.value ? infoCategoria(solicitudSeleccionada.value.categoria) : ''
);
const prioridadInfo = computed(() =>
  solicitudSeleccionada.value ? infoPrioridad(solicitudSeleccionada.value.prioridad) : { etiqueta: '', color: '' }
);

onMounted(async () => {
  await cargar();
  const estado = solicitudSeleccionada.value?.estado;
  if (estado && !ESTADOS_TERMINALES.includes(estado)) {
    sondeo();
  }
});

watch(
  () => solicitudSeleccionada.value?.estado,
  (estado) => {
    if (estado && ESTADOS_TERMINALES.includes(estado)) {
      detenerSondeo();
    }
  }
);

onBeforeUnmount(detenerSondeo);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Detalle de solicitud</h1>
      <BaseButton variant="ghost" @click="router.push({ name: 'solicitudes' })">← Volver al listado</BaseButton>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-if="mensajeExito" class="alert alert-success">{{ mensajeExito }}</p>
    <p v-if="mensajeError" class="alert alert-error">{{ mensajeError }}</p>
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

      <p v-if="solicitudSeleccionada.activa === false" class="alert alert-warning">
        Esta solicitud está desactivada. No aparece en el listado, pero sus datos se conservan en el sistema.
      </p>

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
        <BaseButton
          variant="danger"
          :disabled="desactivando || solicitudSeleccionada.activa === false"
          @click="desactivar"
        >
          {{ desactivando ? 'Desactivando...' : 'Desactivar solicitud' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="mostrarConfirmacion" class="confirmation-backdrop" @click.self="cancelarDesactivacion">
      <section
        class="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
      >
        <div class="confirmation-modal__content">
          <h2 id="confirmation-title">¿Estás absolutamente seguro?</h2>
          <p id="confirmation-description">
            Esta acción no se puede deshacer. La solicitud
            <strong>{{ solicitudSeleccionada?.titulo }}</strong> dejará de aparecer en el listado, pero sus datos se conservarán.
          </p>
        </div>
        <div class="confirmation-modal__actions">
          <BaseButton variant="ghost" :disabled="desactivando" @click="cancelarDesactivacion">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" :disabled="desactivando" @click="confirmarDesactivacion">
            {{ desactivando ? 'Desactivando...' : 'Continuar' }}
          </BaseButton>
        </div>
      </section>
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

.confirmation-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
}

.confirmation-modal {
  width: min(100%, 512px);
  padding: 28px 26px 24px;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.confirmation-modal__content {
  h2 {
    margin: 0 0 12px;
    color: $color-text;
    font-size: 1.15rem;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: $color-text-muted;
    line-height: 1.5;
  }

  strong {
    color: $color-text;
    font-weight: 600;
  }
}

.confirmation-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;

  :deep(.base-button) {
    min-height: 40px;
    padding: 9px 18px;
    border-radius: 7px;
  }

  :deep(.base-button--ghost) {
    background: transparent;
    border-color: $color-border;
    color: $color-text-muted;
  }

  :deep(.base-button--danger) {
    background: $color-error;
    color: #fff;
  }
}

@media (max-width: $breakpoint-mobile) {
  .confirmation-modal {
    padding: 24px 20px 20px;
  }

  .confirmation-modal__actions {
    flex-direction: column-reverse;

    :deep(.base-button) {
      width: 100%;
    }
  }
}
</style>
