const { CATEGORIAS, PRIORIDADES } = require('../models/Solicitud');

/**
 * Valida el cuerpo de la petición para crear una solicitud.
 * Devuelve una lista de errores legibles para el usuario (sin detalles técnicos).
 */
function validarCreacionSolicitud(req, res, next) {
  const errores = [];
  const { titulo, descripcion, categoria, prioridad } = req.body || {};

  if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 3) {
    errores.push('El título es obligatorio y debe tener al menos 3 caracteres.');
  }

  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length < 5) {
    errores.push('La descripción es obligatoria y debe tener al menos 5 caracteres.');
  }

  if (!categoria || !CATEGORIAS.includes(categoria)) {
    errores.push(`La categoría es obligatoria y debe ser una de: ${CATEGORIAS.join(', ')}.`);
  }

  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    errores.push(`La prioridad debe ser una de: ${PRIORIDADES.join(', ')}.`);
  }

  if (errores.length > 0) {
    return res.status(400).json({
      exito: false,
      mensaje: 'La información enviada no es válida.',
      errores
    });
  }

  next();
}

/**
 * Valida el cuerpo de la petición para actualizar una solicitud.
 * Todos los campos son opcionales, pero si vienen deben ser válidos.
 */
function validarActualizacionSolicitud(req, res, next) {
  const errores = [];
  const { titulo, descripcion, categoria, prioridad, estado } = req.body || {};

  if (titulo !== undefined && (typeof titulo !== 'string' || titulo.trim().length < 3)) {
    errores.push('El título debe tener al menos 3 caracteres.');
  }

  if (descripcion !== undefined && (typeof descripcion !== 'string' || descripcion.trim().length < 5)) {
    errores.push('La descripción debe tener al menos 5 caracteres.');
  }

  if (categoria !== undefined && !CATEGORIAS.includes(categoria)) {
    errores.push(`La categoría debe ser una de: ${CATEGORIAS.join(', ')}.`);
  }

  if (prioridad !== undefined && !PRIORIDADES.includes(prioridad)) {
    errores.push(`La prioridad debe ser una de: ${PRIORIDADES.join(', ')}.`);
  }

  if (estado !== undefined) {
    errores.push('El estado de una solicitud es administrado por el sistema y no puede modificarse manualmente.');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      exito: false,
      mensaje: 'La información enviada no es válida.',
      errores
    });
  }

  next();
}

module.exports = { validarCreacionSolicitud, validarActualizacionSolicitud };
