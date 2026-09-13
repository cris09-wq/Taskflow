import { defineStore } from 'pinia';
import requestService from '../services/requestService';

/**
 * Estado global relacionado con solicitudes (sección 3.5 del enunciado):
 * listado, solicitud seleccionada, filtros y estadísticas del Dashboard.
 */
export const useRequestStore = defineStore('requests', {
  state: () => ({
    solicitudes: [],
    solicitudSeleccionada: null,
    estadisticas: {
      total: 0,
      PENDIENTE: 0,
      EN_COLA: 0,
      PROCESANDO: 0,
      RESPONDIDA: 0,
      ERROR: 0
    },
    filtros: {
      busqueda: '',
      categoria: '',
      estado: '',
      prioridad: ''
    },
    cargando: false,
    error: null
  }),

  getters: {
    solicitudesRecientes: (state) => state.solicitudes.slice(0, 5)
  },

  actions: {
    async cargarSolicitudes() {
      this.cargando = true;
      this.error = null;
      try {
        const respuesta = await requestService.listar(this.filtros);
        this.solicitudes = respuesta.datos;
      } catch (err) {
        this.error = err.mensaje || 'No fue posible cargar las solicitudes.';
      } finally {
        this.cargando = false;
      }
    },

    async cargarEstadisticas() {
      try {
        const respuesta = await requestService.obtenerEstadisticas();
        this.estadisticas = respuesta.datos;
      } catch (err) {
        console.error('No fue posible cargar las estadísticas:', err.mensaje);
      }
    },

    async cargarSolicitud(id) {
      this.cargando = true;
      this.error = null;
      try {
        const respuesta = await requestService.obtener(id);
        this.solicitudSeleccionada = respuesta.datos;
        return { cache: respuesta.cache };
      } catch (err) {
        this.error = err.mensaje || 'No fue posible cargar la solicitud.';
        return { cache: null };
      } finally {
        this.cargando = false;
      }
    },

    /**
     * Actualiza en memoria una solicitud existente cuando llega un evento
     * de Socket.IO, evitando tener que recargar toda la lista.
     */
    actualizarSolicitudLocal(solicitud) {
      const index = this.solicitudes.findIndex((s) => s._id === solicitud._id);
      if (index !== -1) {
        this.solicitudes[index] = { ...this.solicitudes[index], ...solicitud };
      } else {
        this.solicitudes.unshift(solicitud);
      }

      if (this.solicitudSeleccionada && this.solicitudSeleccionada._id === solicitud._id) {
        this.solicitudSeleccionada = { ...this.solicitudSeleccionada, ...solicitud };
      }
    },

    setFiltros(filtros) {
      this.filtros = { ...this.filtros, ...filtros };
    }
  }
});
