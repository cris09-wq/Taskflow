/**
 * Envuelve un controlador async para propagar errores automáticamente
 * al middleware de manejo de errores, evitando try/catch repetitivo.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
