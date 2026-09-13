<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import RequestForm from '../components/Requests/RequestForm.vue';
import requestService from '../services/requestService';

const router = useRouter();
const enviando = ref(false);
const errorEnvio = ref(null);
const exito = ref(null);

async function manejarSubmit(datos) {
  enviando.value = true;
  errorEnvio.value = null;
  exito.value = null;

  try {
    const respuesta = await requestService.crear(datos);
    exito.value = respuesta.mensaje;

    // Se redirige al detalle para que el usuario observe el avance de
    // estado en tiempo real (PENDIENTE → EN COLA → PROCESANDO → RESPONDIDA).
    setTimeout(() => {
      router.push({ name: 'solicitudes-detalle', params: { id: respuesta.datos._id } });
    }, 700);
  } catch (err) {
    errorEnvio.value = err.errores?.length ? err.errores.join(' ') : err.mensaje;
  } finally {
    enviando.value = false;
  }
}

function manejarCancelar() {
  router.push({ name: 'solicitudes' });
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Nueva solicitud</h1>
    </div>

    <p v-if="errorEnvio" class="alert alert-error">{{ errorEnvio }}</p>
    <p v-if="exito" class="alert alert-success">{{ exito }} Redirigiendo al detalle...</p>

    <RequestForm :enviando="enviando" @submit="manejarSubmit" @cancel="manejarCancelar" />
  </div>
</template>
