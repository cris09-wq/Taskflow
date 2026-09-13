<script setup>
defineProps({
  conectado: { type: Boolean, default: false }
});

defineEmits(['toggle-menu']);
</script>

<template>
  <header class="app-header">
    <button class="app-header__menu-btn" aria-label="Abrir menú" @click="$emit('toggle-menu')">
      ☰
    </button>

    <div class="app-header__brand">
      <span class="app-header__logo">⚡</span>
      <span class="app-header__title">TASKFLOW</span>
    </div>

    <div class="app-header__status" :title="conectado ? 'Conectado en tiempo real' : 'Sin conexión en tiempo real'">
      <span class="app-header__dot" :class="{ 'app-header__dot--on': conectado }" />
      <span class="app-header__status-label">{{ conectado ? 'En línea' : 'Desconectado' }}</span>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.app-header {
  height: $header-height;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  background: $color-surface;
  border-bottom: 1px solid $color-border;
  position: sticky;
  top: 0;
  z-index: 20;
}

.app-header__menu-btn {
  display: none;
  border: none;
  background: transparent;
  font-size: 1.3rem;
  padding: 6px;

  @media (max-width: $breakpoint-tablet) {
    display: inline-flex;
  }
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  color: $color-primary;
}

.app-header__status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: $color-text-muted;
}

.app-header__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: $color-error;

  &--on {
    background: $color-respondida;
  }
}

.app-header__status-label {
  @media (max-width: $breakpoint-mobile) {
    display: none;
  }
}
</style>
