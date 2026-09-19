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
    <div class="main-layout__body">
      <aside class="main-layout__sidebar" :class="{ 'main-layout__sidebar--open': menuAbierto }">
        <div class="main-layout__brand">
          <div class="main-layout__brand-mark">⚡</div>
          <div>
            <strong>TASKFLOW</strong>
            <span>ENTERPRISE OS</span>
          </div>
        </div>

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

      <div class="main-layout__workspace">
        <AppHeader :conectado="conectado" @toggle-menu="toggleMenu" />
        <main class="main-layout__content">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.main-layout {
  min-height: 100vh;
}

.main-layout__body {
  display: flex;
  min-height: 100vh;
}

.main-layout__sidebar {
  width: $sidebar-width;
  background: rgba(8, 15, 26, 0.96);
  border-right: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 24px 14px 16px;

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
  gap: 6px;
}

.main-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  margin: 0 0 34px;

  strong,
  span {
    display: block;
  }

  strong {
    color: $color-text;
    font-size: 1.05rem;
    letter-spacing: 0.04em;
  }

  span {
    margin-top: 2px;
    color: $color-secondary;
    font-size: 0.52rem;
    font-weight: 800;
    letter-spacing: 0.1em;
  }
}

.main-layout__brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, $color-primary, $color-secondary);
  color: #fff;
  box-shadow: 0 5px 14px rgba(168, 85, 247, 0.35);
  font-size: 1rem;
}

.main-layout__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: $color-text-muted;
  font-weight: 600;
  font-size: 0.9rem;

  &:hover {
    background: rgba(168, 85, 247, 0.08);
    color: #d8b4fe;
  }

  &--active {
    background: rgba(168, 85, 247, 0.18);
    border-color: rgba(168, 85, 247, 0.28);
    color: #e9d5ff;
  }
}

.main-layout__icon {
  font-size: 1rem;
}

.main-layout__content {
  flex: 1;
  min-width: 0;
  background: $color-bg;
}

.main-layout__workspace {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  flex-direction: column;
  background: $color-bg;
}

</style>
