<script setup>
defineProps({
  etiqueta: { type: String, required: true },
  valor: { type: [Number, String], required: true },
  color: { type: String, default: '#4f46e5' },
  icono: { type: String, default: '📊' }
});
</script>

<template>
  <div class="stat-card card">
    <div class="stat-card__icon" :style="{ backgroundColor: `${color}1a`, color }">
      {{ icono }}
    </div>
    <div class="stat-card__info">
      <span class="stat-card__valor">{{ valor }}</span>
      <span class="stat-card__etiqueta">{{ etiqueta }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-card__valor {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-card__etiqueta {
  font-size: 0.85rem;
  color: $color-text-muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
