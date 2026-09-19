<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRequests } from '../composables/useRequests';
import { useSocket } from '../composables/useSocket';
import RequestsTable from '../components/Tables/RequestsTable.vue';
import BaseButton from '../components/Buttons/BaseButton.vue';
import RequestForm from '../components/Requests/RequestForm.vue';
import requestService from '../services/requestService';

const { solicitudes, cargando, error, filtros, aplicarFiltros, actualizarSolicitudLocal } = useRequests();
const { on } = useSocket();
const isModalOpen = ref(false);
const enviando = ref(false);
const errorEnvio = ref(null);
const exito = ref(null);
const paginaActual = ref(1);
const solicitudesPorPagina = 10;

const filtrosLocales = reactive({
  busqueda: filtros.value.busqueda,
  categoria: filtros.value.categoria,
  estado: filtros.value.estado
});

function buscar() {
  paginaActual.value = 1;
  aplicarFiltros(filtrosLocales);
}

function limpiarFiltros() {
  filtrosLocales.busqueda = '';
  filtrosLocales.categoria = '';
  filtrosLocales.estado = '';
  paginaActual.value = 1;
  aplicarFiltros(filtrosLocales);
}

const totalPaginas = computed(() => Math.max(1, Math.ceil(solicitudes.value.length / solicitudesPorPagina)));
const solicitudesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * solicitudesPorPagina;
  return solicitudes.value.slice(inicio, inicio + solicitudesPorPagina);
});
const paginasVisibles = computed(() => {
  const cantidadVisible = Math.min(5, totalPaginas.value);
  const maxInicio = totalPaginas.value - cantidadVisible + 1;
  const inicio = Math.min(Math.max(paginaActual.value - 2, 1), maxInicio);

  return Array.from({ length: cantidadVisible }, (_, indice) => inicio + indice);
});
const indiceInicial = computed(() => (solicitudes.value.length ? (paginaActual.value - 1) * solicitudesPorPagina + 1 : 0));
const indiceFinal = computed(() => Math.min(paginaActual.value * solicitudesPorPagina, solicitudes.value.length));

function cambiarPagina(pagina) {
  paginaActual.value = Math.min(Math.max(pagina, 1), totalPaginas.value);
}

function abrirModal() {
  errorEnvio.value = null;
  exito.value = null;
  isModalOpen.value = true;
}

function cerrarModal() {
  if (enviando.value) return;
  isModalOpen.value = false;
}

async function manejarSubmit(datos) {
  enviando.value = true;
  errorEnvio.value = null;
  exito.value = null;

  try {
    const respuesta = await requestService.crear(datos);
    exito.value = respuesta.mensaje;
    isModalOpen.value = false;
  } catch (err) {
    errorEnvio.value = err.errores?.length ? err.errores.join(' ') : err.mensaje;
  } finally {
    enviando.value = false;
  }
}

on('solicitud-creada', actualizarSolicitudLocal);
on('solicitud-encolada', actualizarSolicitudLocal);
on('solicitud-procesando', actualizarSolicitudLocal);
on('solicitud-respondida', actualizarSolicitudLocal);
on('solicitud-error', actualizarSolicitudLocal);

onMounted(() => aplicarFiltros(filtrosLocales));
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Solicitudes</h1>
      <BaseButton variant="primary" @click="abrirModal">
        ➕ Nueva solicitud
      </BaseButton>
    </div>

    <p v-if="errorEnvio" class="alert alert-error">{{ errorEnvio }}</p>
    <p v-if="exito" class="alert alert-success">{{ exito }}</p>

    <div class="requests-filters card">
      <div class="form-field requests-filters__search">
        <label for="busqueda">Buscar</label>
        <input
          id="busqueda"
          v-model="filtrosLocales.busqueda"
          type="text"
          placeholder="Buscar por título o descripción"
          @keyup.enter="buscar"
        />
      </div>

      <div class="form-field">
        <label for="categoria">Categoría</label>
        <select id="categoria" v-model="filtrosLocales.categoria">
          <option value="">Todas</option>
          <option value="informacion">Información</option>
          <option value="soporte">Soporte</option>
          <option value="documento">Documento</option>
          <option value="consulta">Consulta</option>
          <option value="actualizacion">Actualización</option>
        </select>
      </div>

      <div class="form-field">
        <label for="estado">Estado</label>
        <select id="estado" v-model="filtrosLocales.estado">
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_COLA">En cola</option>
          <option value="PROCESANDO">Procesando</option>
          <option value="RESPONDIDA">Respondida</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      <div class="requests-filters__actions">
        <BaseButton variant="primary" @click="buscar">Filtrar</BaseButton>
        <BaseButton variant="ghost" @click="limpiarFiltros">Limpiar</BaseButton>
      </div>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div class="card">
      <p v-if="cargando" class="empty-state">Cargando solicitudes...</p>
      <p v-else-if="solicitudes.length === 0" class="empty-state">
        No se encontraron solicitudes con los criterios seleccionados.
      </p>
      <template v-else>
        <RequestsTable :solicitudes="solicitudesPaginadas" />

        <div class="pagination" aria-label="Paginación de solicitudes">
          <span class="pagination__summary">Mostrando {{ indiceInicial }}-{{ indiceFinal }} de {{ solicitudes.length }}</span>
          <div class="pagination__controls">
            <button
              class="pagination__arrow"
              type="button"
              aria-label="Página anterior"
              :disabled="paginaActual === 1"
              @click="cambiarPagina(paginaActual - 1)"
            >
              ‹
            </button>
            <button
              v-for="pagina in paginasVisibles"
              :key="pagina"
              class="pagination__page"
              :class="{ 'pagination__page--active': pagina === paginaActual }"
              type="button"
              :aria-label="`Ir a la página ${pagina}`"
              :aria-current="pagina === paginaActual ? 'page' : undefined"
              @click="cambiarPagina(pagina)"
            >
              {{ pagina }}
            </button>
            <button
              class="pagination__arrow"
              type="button"
              aria-label="Página siguiente"
              :disabled="paginaActual === totalPaginas"
              @click="cambiarPagina(paginaActual + 1)"
            >
              ›
            </button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="isModalOpen" class="modal-backdrop" @click.self="cerrarModal">
      <section class="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
        <div class="request-modal__header">
          <h2 id="request-modal-title">Nueva solicitud</h2>
          <button
            class="request-modal__close"
            type="button"
            aria-label="Cerrar formulario"
            :disabled="enviando"
            @click="cerrarModal"
          >
            ×
          </button>
        </div>
        <RequestForm :enviando="enviando" @submit="manejarSubmit" @cancel="cerrarModal" />
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.requests-filters {
  padding: 18px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 14px;
  align-items: end;

  .form-field {
    margin-bottom: 0;
  }

  @media (max-width: $breakpoint-tablet) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: $breakpoint-mobile) {
    grid-template-columns: 1fr;
  }
}

.requests-filters__actions {
  display: flex;
  gap: 8px;

  @media (max-width: $breakpoint-mobile) {
    :deep(.base-button) {
      flex: 1;
    }
  }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
}

.request-modal {
  width: min(100%, 680px);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: $color-surface;
  border-radius: $radius-md;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.request-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;

  h2 {
    margin: 0;
    font-size: 1.25rem;
  }
}

.request-modal__close {
  border: 0;
  background: transparent;
  color: $color-text-muted;
  font-size: 1.7rem;
  line-height: 1;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

:deep(.request-form) {
  max-width: none;
  box-shadow: none;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 14px 4px;
}

.pagination__summary {
  color: $color-text-muted;
  font-size: 0.85rem;
}

.pagination__controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pagination__page,
.pagination__arrow {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #dfe4ee;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    border-color: $color-primary;
    color: $color-primary;
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.pagination__page--active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  box-shadow: 0 8px 18px rgba(168, 85, 247, 0.18);
}

.pagination__arrow {
  color: #8b5cf6;
  font-size: 1.3rem;
  line-height: 1;
}

[data-theme='light'] .pagination__page,
[data-theme='light'] .pagination__arrow {
  background: #ffffff;
  border-color: #dfe4ee;
  color: #6b7280;
}

[data-theme='light'] .pagination__page--active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
}

:global([data-theme='dark']) .pagination__page,
:global([data-theme='dark']) .pagination__arrow {
  background: #111827 !important;
  border-color: #263244 !important;
  color: #94a3b8 !important;
}

:global([data-theme='dark']) .pagination__page--active {
  background: $color-primary !important;
  border-color: $color-primary !important;
  color: #fff !important;
}

@media (max-width: $breakpoint-mobile) {
  .pagination {
    align-items: stretch;
    flex-direction: column;
    padding-inline: 0;
  }

  .pagination__summary {
    text-align: center;
  }

  .pagination__controls {
    justify-content: center;
  }
}
</style>
