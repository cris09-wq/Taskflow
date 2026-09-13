<script setup>
import { computed } from 'vue';
import { useRequestStatus } from '../../composables/useRequestStatus';

const props = defineProps({
  estado: { type: String, required: true }
});

const { infoEstado } = useRequestStatus();
const info = computed(() => infoEstado(props.estado));
</script>

<template>
  <span class="status-badge" :style="{ color: info.color, borderColor: info.color, backgroundColor: `${info.color}1a` }">
    <span class="status-badge__icon" aria-hidden="true">{{ info.icono }}</span>
    {{ info.etiqueta }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge__icon {
  font-size: 0.85rem;
}
</style>
