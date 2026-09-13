import apiClient from '../plugins/axios';

/**
 * Centraliza toda la comunicación con la API Express relacionada con
 * solicitudes y el monitor del sistema (sección 3.7 del enunciado).
 * El frontend NUNCA se conecta directamente a MongoDB o Redis.
 */
const requestService = {
  /**
   * GET /solicitudes
   */
  async listar(filtros = {}) {
    const params = {};
    if (filtros.busqueda) params.q = filtros.busqueda;
    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.estado) params.estado = filtros.estado;
    if (filtros.prioridad) params.prioridad = filtros.prioridad;

    const { data } = await apiClient.get('/solicitudes', { params });
    return data;
  },

  /**
   * GET /solicitudes/:id
   */
  async obtener(id) {
    const { data } = await apiClient.get(`/solicitudes/${id}`);
    return data;
  },

  /**
   * POST /solicitudes
   */
  async crear(payload) {
    const { data } = await apiClient.post('/solicitudes', payload);
    return data;
  },

  /**
   * PUT /solicitudes/:id
   */
  async actualizar(id, payload) {
    const { data } = await apiClient.put(`/solicitudes/${id}`, payload);
    return data;
  },

  /**
   * DELETE /solicitudes/:id
   */
  async eliminar(id) {
    const { data } = await apiClient.delete(`/solicitudes/${id}`);
    return data;
  },

  /**
   * GET /solicitudes/estadisticas/resumen
   */
  async obtenerEstadisticas() {
    const { data } = await apiClient.get('/solicitudes/estadisticas/resumen');
    return data;
  },

  /**
   * GET /monitor
   */
  async obtenerMonitor() {
    const { data } = await apiClient.get('/monitor');
    return data;
  }
};

export default requestService;
