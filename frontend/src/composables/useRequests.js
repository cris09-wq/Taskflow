import { storeToRefs } from 'pinia';
import { useRequestStore } from '../store/requestStore';
import requestService from '../services/requestService';
import { useFetch } from './useFetch';

/**
 * Composable que centraliza las operaciones de consulta y registro de
 * solicitudes reutilizables entre las diferentes Views (sección 3.4).
 */
export function useRequests() {
  const store = useRequestStore();
  const { solicitudes, solicitudSeleccionada, estadisticas, filtros, cargando, error } = storeToRefs(store);
  const { ejecutar } = useFetch();

  async function cargarSolicitudes() {
    await store.cargarSolicitudes();
  }

  async function cargarEstadisticas() {
    await store.cargarEstadisticas();
  }

  async function cargarSolicitud(id) {
    return store.cargarSolicitud(id);
  }

  async function crearSolicitud(payload) {
    return ejecutar(() => requestService.crear(payload));
  }

  async function eliminarSolicitud(id) {
    return ejecutar(() => requestService.eliminar(id));
  }

  function aplicarFiltros(nuevosFiltros) {
    store.setFiltros(nuevosFiltros);
    return cargarSolicitudes();
  }

  function actualizarSolicitudLocal(solicitud) {
    store.actualizarSolicitudLocal(solicitud);
  }

  return {
    solicitudes,
    solicitudSeleccionada,
    estadisticas,
    filtros,
    cargando,
    error,
    cargarSolicitudes,
    cargarEstadisticas,
    cargarSolicitud,
    crearSolicitud,
    eliminarSolicitud,
    aplicarFiltros,
    actualizarSolicitudLocal
  };
}
