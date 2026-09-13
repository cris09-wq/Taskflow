<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRequests } from '../composables/useRequests';
import { useSocket } from '../composables/useSocket';
import StatCard from '../components/StatCard/StatCard.vue';
import RequestCard from '../components/Requests/RequestCard.vue';
import BaseButton from '../components/Buttons/BaseButton.vue';

const router = useRouter();
const { solicitudes, estadisticas, cargando, error, cargarSolicitudes, cargarEstadisticas, actualizarSolicitudLocal } =
  useRequests();
const { on } = useSocket();

async function cargarTodo() {
  await Promise.all([cargarSolicitudes(), cargarEstadisticas()]);
}

// Los indicadores del Dashboard se actualizan en tiempo real mediante
// Socket.IO, sin recargar la página (HU-16).
function manejarEventoEstado(solicitud) {
  actualizarSolicitudLocal(solicitud);
  cargarEstadisticas();
}

on('solicitud-creada', manejarEventoEstado);
on('solicitud-encolada', manejarEventoEstado);
on('solicitud-procesando', manejarEventoEstado);
on('solicitud-respondida', manejarEventoEstado);
on('solicitud-error', manejarEventoEstado);
on('monitor-actualizado', cargarEstadisticas);

onMounted(cargarTodo);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Dashboard</h1>
      <BaseButton variant="primary" @click="router.push({ name: 'solicitudes-nueva' })">
        ➕ Nueva solicitud
      </BaseButton>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div class="grid-stats">
      <StatCard etiqueta="Total" :valor="estadisticas.total" color="#4f46e5" icono="📊" />
      <StatCard etiqueta="Pendientes" :valor="estadisticas.PENDIENTE" color="#9ca3af" icono="⏳" />
      <StatCard etiqueta="En cola" :valor="estadisticas.EN_COLA" color="#f59e0b" icono="📥" />
      <StatCard etiqueta="Procesando" :valor="estadisticas.PROCESANDO" color="#0ea5e9" icono="⚙️" />
      <StatCard etiqueta="Respondidas" :valor="estadisticas.RESPONDIDA" color="#22c55e" icono="✅" />
      <StatCard etiqueta="Con error" :valor="estadisticas.ERROR" color="#ef4444" icono="⚠️" />
    </div>

    <section>
      <div class="page-header">
        <h2 class="section-title">Solicitudes recientes</h2>
      </div>

      <p v-if="cargando" class="empty-state">Cargando solicitudes...</p>
      <p v-else-if="solicitudes.length === 0" class="empty-state">
        Aún no hay solicitudes registradas. ¡Registra la primera!
      </p>

      <div v-else class="dashboard__recent">
        <RequestCard v-for="solicitud in solicitudes.slice(0, 6)" :key="solicitud._id" :solicitud="solicitud" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.section-title {
  font-size: 1.1rem;
  margin: 0;
}

.dashboard__recent {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
</style>
