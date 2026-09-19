<script setup>
import { useTheme } from '../../composables/useTheme';

defineProps({
  conectado: { type: Boolean, default: false }
});

defineEmits(['toggle-menu']);

const { temaOscuro, establecerTema } = useTheme();
</script>

<template>
  <header class="app-header">
    <button class="app-header__menu-btn" aria-label="Abrir menú" @click="$emit('toggle-menu')">
      ☰
    </button>

    <div class="app-header__theme-switch" role="group" aria-label="Seleccionar tema">
      <button
        class="app-header__theme-option"
        :class="{ 'app-header__theme-option--active': !temaOscuro }"
        type="button"
        aria-label="Activar modo claro"
        title="Modo claro"
        @click="establecerTema(false)"
      >
        <span aria-hidden="true">☼</span>
      </button>
      <button
        class="app-header__theme-option"
        :class="{ 'app-header__theme-option--active': temaOscuro }"
        type="button"
        aria-label="Activar modo oscuro"
        title="Modo oscuro"
        @click="establecerTema(true)"
      >
        <span aria-hidden="true">☾</span>
      </button>
    </div>

  </header>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  background: rgba(10, 15, 24, 0.96);
  border-bottom: 1px solid $color-border;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
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

.app-header__theme-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 3px;
  border: 1px solid $color-border;
  border-radius: 999px;
  background: rgba(13, 20, 34, 0.9);
}

.app-header__theme-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: $color-text-muted;
  font-size: 1.05rem;
  line-height: 1;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    color: $color-primary;
  }

  &--active {
    background: rgba(168, 85, 247, 0.18);
    color: #f5d0fe;
    box-shadow: inset 0 0 0 1px rgba(168, 85, 247, 0.35);
  }
}

</style>
