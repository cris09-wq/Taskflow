<script setup>
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useRequests } from '../composables/useRequests';
import { useSocket } from '../composables/useSocket';
import RequestsTable from '../components/Tables/RequestsTable.vue';
import BaseButton from '../components/Buttons/BaseButton.vue';

const router = useRouter();
const { solicitudes, cargando, error, filtros, aplicarFiltros, actualizarSolicitudLocal } = useRequests();
const { on } = useSocket();

const filtrosLocales = reactive({
  busqueda: filtros.value.busqueda,
  categoria: filtros.value.categoria,
  estado: filtros.value.estado
});

function buscar() {
  aplicarFiltros(filtrosLocales);
}

function limpiarFiltros() {
  filtrosLocales.busqueda = '';
  filtrosLocales.categoria = '';
  filtrosLocales.estado = '';
  aplicarFiltros(filtrosLocales);
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
      <BaseButton variant="primary" @click="router.push({ name: 'solicitudes-nueva' })">
        ➕ Nueva solicitud
      </BaseButton>
    </div>

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
      <RequestsTable v-else :solicitudes="solicitudes" />
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
</style>
