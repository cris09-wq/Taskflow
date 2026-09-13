/**
 * Lógica reutilizable para representar visualmente los estados de una
 * solicitud (HU-07: "Cada estado debe tener una representación visual
 * diferenciable").
 */
const ESTADOS_INFO = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#9ca3af', icono: '⏳' },
  EN_COLA: { etiqueta: 'En cola', color: '#f59e0b', icono: '📥' },
  PROCESANDO: { etiqueta: 'Procesando', color: '#0ea5e9', icono: '⚙️' },
  RESPONDIDA: { etiqueta: 'Respondida', color: '#22c55e', icono: '✅' },
  ERROR: { etiqueta: 'Error', color: '#ef4444', icono: '⚠️' }
};

const CATEGORIAS_INFO = {
  informacion: 'Información',
  soporte: 'Soporte',
  documento: 'Documento',
  consulta: 'Consulta',
  actualizacion: 'Actualización'
};

const PRIORIDADES_INFO = {
  baja: { etiqueta: 'Baja', color: '#22c55e' },
  media: { etiqueta: 'Media', color: '#f59e0b' },
  alta: { etiqueta: 'Alta', color: '#ef4444' }
};

export function useRequestStatus() {
  function infoEstado(estado) {
    return ESTADOS_INFO[estado] || { etiqueta: estado || 'Desconocido', color: '#9ca3af', icono: '•' };
  }

  function infoCategoria(categoria) {
    return CATEGORIAS_INFO[categoria] || categoria;
  }

  function infoPrioridad(prioridad) {
    return PRIORIDADES_INFO[prioridad] || { etiqueta: prioridad || '—', color: '#9ca3af' };
  }

  return { infoEstado, infoCategoria, infoPrioridad, ESTADOS_INFO, CATEGORIAS_INFO, PRIORIDADES_INFO };
}
