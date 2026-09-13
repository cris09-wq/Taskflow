const mongoose = require('mongoose');

// Categorías soportadas (sección 14 y HU-06 del enunciado).
const CATEGORIAS = ['informacion', 'soporte', 'documento', 'consulta', 'actualizacion'];

// Prioridades soportadas.
const PRIORIDADES = ['baja', 'media', 'alta'];

// Estados del ciclo de vida de una solicitud (sección 13 y HU-07).
const ESTADOS = ['PENDIENTE', 'EN_COLA', 'PROCESANDO', 'RESPONDIDA', 'ERROR'];

const solicitudSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio.'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres.'],
      maxlength: [150, 'El título no puede superar los 150 caracteres.']
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria.'],
      trim: true,
      minlength: [5, 'La descripción debe tener al menos 5 caracteres.'],
      maxlength: [2000, 'La descripción no puede superar los 2000 caracteres.']
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria.'],
      enum: {
        values: CATEGORIAS,
        message: 'Categoría inválida. Valores permitidos: ' + CATEGORIAS.join(', ')
      }
    },
    prioridad: {
      type: String,
      required: [true, 'La prioridad es obligatoria.'],
      enum: {
        values: PRIORIDADES,
        message: 'Prioridad inválida. Valores permitidos: ' + PRIORIDADES.join(', ')
      },
      default: 'media'
    },
    estado: {
      type: String,
      enum: ESTADOS,
      default: 'PENDIENTE'
    },
    respuesta: {
      type: String,
      default: null
    },
    error: {
      type: String,
      default: null
    },
    fechaCreacion: {
      type: Date,
      default: Date.now
    },
    fechaProcesamiento: {
      type: Date,
      default: null
    },
    fechaRespuesta: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

solicitudSchema.index({ estado: 1 });
solicitudSchema.index({ categoria: 1 });
solicitudSchema.index({ titulo: 'text', descripcion: 'text' });

const Solicitud = mongoose.model('Solicitud', solicitudSchema);

module.exports = { Solicitud, CATEGORIAS, PRIORIDADES, ESTADOS };
