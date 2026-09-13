/**
 * Formatea una fecha ISO a un formato legible en español.
 * Devuelve un guion si la fecha no existe (por ejemplo, fechaProcesamiento
 * antes de que la solicitud haya sido tomada por el Worker).
 */
export function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
