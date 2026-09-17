const mongoose = require('mongoose');

// Este esquema debe mantenerse sincronizado con backend/src/models/Solicitud.js
// Ambos procesos (API y Worker) leen y escriben sobre la misma colección de MongoDB.

const CATEGORIAS = ['informacion', 'soporte', 'documento', 'consulta', 'actualizacion'];
const PRIORIDADES = ['baja', 'media', 'alta'];
const ESTADOS = ['PENDIENTE', 'EN_COLA', 'PROCESANDO', 'RESPONDIDA', 'ERROR'];

const solicitudSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, enum: CATEGORIAS },
    prioridad: { type: String, required: true, enum: PRIORIDADES, default: 'media' },
    estado: { type: String, enum: ESTADOS, default: 'PENDIENTE' },
    respuesta: { type: String, default: null },
    error: { type: String, default: null },
    fechaCreacion: { type: Date, default: Date.now },
    fechaProcesamiento: { type: Date, default: null },
    fechaRespuesta: { type: Date, default: null },
    activa: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

const Solicitud = mongoose.model('Solicitud', solicitudSchema);

module.exports = { Solicitud, CATEGORIAS, PRIORIDADES, ESTADOS };
