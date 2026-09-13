<script setup>
import { useRouter } from 'vue-router';
import { useRequestStatus } from '../../composables/useRequestStatus';
import { formatDate } from '../../utils/formatDate';
import StatusBadge from '../Status/StatusBadge.vue';

defineProps({
  solicitudes: { type: Array, required: true }
});

const router = useRouter();
const { infoCategoria, infoPrioridad } = useRequestStatus();

function verDetalle(id) {
  router.push({ name: 'solicitudes-detalle', params: { id } });
}
</script>

<template>
  <div class="table-wrapper">
    <table class="requests-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Solicitud</th>
          <th>Categoría</th>
          <th>Prioridad</th>
          <th>Estado</th>
          <th>Fecha</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="solicitud in solicitudes" :key="solicitud._id">
          <td data-label="ID" class="requests-table__id">{{ solicitud._id.slice(-6) }}</td>
          <td data-label="Solicitud" class="requests-table__titulo">{{ solicitud.titulo }}</td>
          <td data-label="Categoría">{{ infoCategoria(solicitud.categoria) }}</td>
          <td data-label="Prioridad">
            <span
              class="priority-dot"
              :style="{ backgroundColor: infoPrioridad(solicitud.prioridad).color }"
            />
            {{ infoPrioridad(solicitud.prioridad).etiqueta }}
          </td>
          <td data-label="Estado"><StatusBadge :estado="solicitud.estado" /></td>
          <td data-label="Fecha">{{ formatDate(solicitud.fechaCreacion || solicitud.createdAt) }}</td>
          <td data-label="">
            <button class="requests-table__ver" @click="verDetalle(solicitud._id)">Ver detalle</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.requests-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;

  th,
  td {
    text-align: left;
    padding: 12px 14px;
    border-bottom: 1px solid $color-border;
    font-size: 0.9rem;
  }

  th {
    color: $color-text-muted;
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  tbody tr:hover {
    background: rgba(79, 70, 229, 0.04);
  }
}

.requests-table__id {
  font-family: monospace;
  color: $color-text-muted;
}

.requests-table__titulo {
  font-weight: 600;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.requests-table__ver {
  border: none;
  background: transparent;
  color: $color-primary;
  font-weight: 600;
  font-size: 0.85rem;

  &:hover {
    text-decoration: underline;
  }
}

.priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

@media (max-width: $breakpoint-mobile) {
  .requests-table {
    min-width: 0;

    thead {
      display: none;
    }

    tbody tr {
      display: block;
      border-bottom: 8px solid $color-bg;
      padding: 8px 0;
    }

    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: none;
      gap: 12px;

      &::before {
        content: attr(data-label);
        font-weight: 600;
        color: $color-text-muted;
        font-size: 0.75rem;
        text-transform: uppercase;
      }
    }

    .requests-table__titulo {
      max-width: none;
      white-space: normal;
      text-align: right;
    }
  }
}
</style>
