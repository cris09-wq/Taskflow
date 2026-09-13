import { ref } from 'vue';

/**
 * Composable genérico para ejecutar peticiones asíncronas controlando
 * estados de carga y error, evitando repetir este patrón en cada vista.
 */
export function useFetch() {
  const cargando = ref(false);
  const error = ref(null);

  async function ejecutar(fn) {
    cargando.value = true;
    error.value = null;
    try {
      return await fn();
    } catch (err) {
      error.value = err?.mensaje || 'Ocurrió un error inesperado. Inténtalo nuevamente.';
      return null;
    } finally {
      cargando.value = false;
    }
  }

  return { cargando, error, ejecutar };
}
