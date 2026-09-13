/**
 * Valida el formulario de "Nueva solicitud" en el cliente, antes de
 * enviarlo al backend (HU-01: "Los campos obligatorios deben validarse
 * antes de enviar").
 * Devuelve un objeto con los errores encontrados, por campo.
 */
export function validarFormularioSolicitud(form) {
  const errores = {};

  if (!form.titulo || form.titulo.trim().length < 3) {
    errores.titulo = 'El título es obligatorio y debe tener al menos 3 caracteres.';
  }

  if (!form.descripcion || form.descripcion.trim().length < 5) {
    errores.descripcion = 'La descripción es obligatoria y debe tener al menos 5 caracteres.';
  }

  if (!form.categoria) {
    errores.categoria = 'Debes seleccionar una categoría.';
  }

  if (!form.prioridad) {
    errores.prioridad = 'Debes seleccionar una prioridad.';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}
