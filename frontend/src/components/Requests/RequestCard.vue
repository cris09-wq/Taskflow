<script setup>
import { useRouter } from 'vue-router';
import { useRequestStatus } from '../../composables/useRequestStatus';
import { formatDate } from '../../utils/formatDate';
import StatusBadge from '../Status/StatusBadge.vue';

const props = defineProps({
  solicitud: { type: Object, required: true }
});

const router = useRouter();
const { infoCategoria } = useRequestStatus();

function irADetalle() {
  router.push({ name: 'solicitudes-detalle', params: { id: props.solicitud._id } });
}
</script>

<template>
  <button class="request-card card" @click="irADetalle">
    <div class="request-card__top">
      <span class="request-card__titulo">{{ solicitud.titulo }}</span>
      <StatusBadge :estado="solicitud.estado" />
    </div>
    <p class="request-card__descripcion">{{ solicitud.descripcion }}</p>
    <div class="request-card__meta">
      <span>{{ infoCategoria(solicitud.categoria) }}</span>
      <span>·</span>
      <span>{{ formatDate(solicitud.fechaCreacion || solicitud.createdAt) }}</span>
    </div>
  </button>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.request-card {
  display: block;
  width: 100%;
  text-align: left;
  padding: 16px;
  border: 1px solid $color-border;
  background: $color-surface;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.1s ease;

  &:hover {
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
  }
}

.request-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.request-card__titulo {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-card__descripcion {
  margin: 4px 0 10px;
  color: $color-text-muted;
  font-size: 0.85rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.request-card__meta {
  display: flex;
  gap: 6px;
  font-size: 0.78rem;
  color: $color-text-muted;
}
</style>
