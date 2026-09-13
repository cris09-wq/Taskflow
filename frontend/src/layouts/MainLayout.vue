<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import AppHeader from '../components/Headers/AppHeader.vue';
import { useSocket } from '../composables/useSocket';

const { conectado } = useSocket();
const menuAbierto = ref(false);

const items = [
  { to: { name: 'dashboard' }, etiqueta: 'Dashboard', icono: '🏠' },
  { to: { name: 'solicitudes' }, etiqueta: 'Solicitudes', icono: '📋' },
  { to: { name: 'solicitudes-nueva' }, etiqueta: 'Nueva', icono: '➕' },
  { to: { name: 'monitor' }, etiqueta: 'Monitor', icono: '🩺' }
];

function toggleMenu() {
  menuAbierto.value = !menuAbierto.value;
}

function cerrarMenu() {
  menuAbierto.value = false;
}
</script>

<template>
  <div class="main-layout">
    <AppHeader :conectado="conectado" @toggle-menu="toggleMenu" />

    <div class="main-layout__body">
      <aside class="main-layout__sidebar" :class="{ 'main-layout__sidebar--open': menuAbierto }">
        <nav class="main-layout__nav">
          <RouterLink
            v-for="item in items"
            :key="item.etiqueta"
            :to="item.to"
            class="main-layout__link"
            active-class="main-layout__link--active"
            @click="cerrarMenu"
          >
            <span class="main-layout__icon">{{ item.icono }}</span>
            {{ item.etiqueta }}
          </RouterLink>
        </nav>
      </aside>

      <div
        v-if="menuAbierto"
        class="main-layout__overlay"
        @click="cerrarMenu"
      />

      <main class="main-layout__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.main-layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.main-layout__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.main-layout__sidebar {
  width: $sidebar-width;
  background: $color-surface;
  border-right: 1px solid $color-border;
  padding: 20px 12px;

  @media (max-width: $breakpoint-tablet) {
    position: fixed;
    top: $header-height;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 30;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.08);

    &--open {
      transform: translateX(0);
    }
  }
}

.main-layout__overlay {
  display: none;

  @media (max-width: $breakpoint-tablet) {
    display: block;
    position: fixed;
    inset: $header-height 0 0 0;
    background: rgba(15, 23, 42, 0.35);
    z-index: 25;
  }
}

.main-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-layout__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: $radius-sm;
  color: $color-text-muted;
  font-weight: 600;
  font-size: 0.9rem;

  &:hover {
    background: rgba(79, 70, 229, 0.06);
    color: $color-primary;
  }

  &--active {
    background: rgba(79, 70, 229, 0.12);
    color: $color-primary;
  }
}

.main-layout__icon {
  font-size: 1rem;
}

.main-layout__content {
  flex: 1;
  min-width: 0;
}
</style>
