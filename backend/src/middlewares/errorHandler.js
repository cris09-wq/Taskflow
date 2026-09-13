/**
 * Middleware centralizado de manejo de errores.
 * Registra el detalle técnico en el servidor pero nunca lo expone al usuario
 * (HU-11: "El usuario no debe recibir mensajes técnicos innecesarios").
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[Error]', err);

  // Errores de validación de Mongoose (por ejemplo, enum inválido a nivel de esquema).
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      exito: false,
      mensaje: 'La información enviada no es válida.',
      errores: Object.values(err.errors).map((e) => e.message)
    });
  }

  // ID de MongoDB con formato incorrecto.
  if (err.name === 'CastError') {
    return res.status(400).json({
      exito: false,
      mensaje: 'El identificador de la solicitud no tiene un formato válido.'
    });
  }

  const status = err.status || 500;
  const mensaje = status === 500
    ? 'Ocurrió un error inesperado. Por favor, inténtalo nuevamente más tarde.'
    : (err.mensaje || err.message || 'Ocurrió un error al procesar la solicitud.');

  res.status(status).json({ exito: false, mensaje });
}

function notFoundHandler(req, res) {
  res.status(404).json({ exito: false, mensaje: 'El recurso solicitado no existe.' });
}

module.exports = { errorHandler, notFoundHandler };
