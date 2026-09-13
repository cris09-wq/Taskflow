<script setup>
import { reactive, ref } from 'vue';
import { validarFormularioSolicitud } from '../../utils/validateRequest';
import BaseButton from '../Buttons/BaseButton.vue';

const emit = defineEmits(['submit', 'cancel']);

defineProps({
  enviando: { type: Boolean, default: false }
});

const CATEGORIAS = [
  { valor: 'informacion', etiqueta: 'Información' },
  { valor: 'soporte', etiqueta: 'Soporte' },
  { valor: 'documento', etiqueta: 'Documento' },
  { valor: 'consulta', etiqueta: 'Consulta' },
  { valor: 'actualizacion', etiqueta: 'Actualización' }
];

const PRIORIDADES = [
  { valor: 'baja', etiqueta: 'Baja' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'alta', etiqueta: 'Alta' }
];

const form = reactive({
  titulo: '',
  descripcion: '',
  categoria: '',
  prioridad: 'media'
});

const errores = ref({});

function manejarEnvio() {
  const resultado = validarFormularioSolicitud(form);
  errores.value = resultado.errores;

  if (!resultado.valido) return;

  emit('submit', { ...form });
}

function manejarCancelar() {
  emit('cancel');
}

defineExpose({ form });
</script>

<template>
  <form class="request-form card" @submit.prevent="manejarEnvio">
    <div class="form-field">
      <label for="titulo">Título</label>
      <input
        id="titulo"
        v-model="form.titulo"
        type="text"
        placeholder="Ej. Solicitud de certificado laboral"
        maxlength="150"
      />
      <span v-if="errores.titulo" class="field-error">{{ errores.titulo }}</span>
    </div>

    <div class="form-field">
      <label for="descripcion">Descripción</label>
      <textarea
        id="descripcion"
        v-model="form.descripcion"
        placeholder="Describe con el mayor detalle posible tu solicitud"
        maxlength="2000"
      />
      <span v-if="errores.descripcion" class="field-error">{{ errores.descripcion }}</span>
    </div>

    <div class="request-form__row">
      <div class="form-field">
        <label for="categoria">Categoría</label>
        <select id="categoria" v-model="form.categoria">
          <option value="" disabled>Selecciona una categoría</option>
          <option v-for="opcion in CATEGORIAS" :key="opcion.valor" :value="opcion.valor">
            {{ opcion.etiqueta }}
          </option>
        </select>
        <span v-if="errores.categoria" class="field-error">{{ errores.categoria }}</span>
      </div>

      <div class="form-field">
        <label for="prioridad">Prioridad</label>
        <select id="prioridad" v-model="form.prioridad">
          <option v-for="opcion in PRIORIDADES" :key="opcion.valor" :value="opcion.valor">
            {{ opcion.etiqueta }}
          </option>
        </select>
        <span v-if="errores.prioridad" class="field-error">{{ errores.prioridad }}</span>
      </div>
    </div>

    <div class="request-form__actions">
      <BaseButton variant="ghost" type="button" :disabled="enviando" @click="manejarCancelar">
        Cancelar
      </BaseButton>
      <BaseButton variant="primary" type="submit" :disabled="enviando">
        {{ enviando ? 'Enviando...' : 'Enviar solicitud' }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.request-form {
  padding: 24px;
  max-width: 640px;
}

.request-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: $breakpoint-mobile) {
    grid-template-columns: 1fr;
  }
}

.request-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;

  @media (max-width: $breakpoint-mobile) {
    flex-direction: column-reverse;

    :deep(.base-button) {
      width: 100%;
    }
  }
}
</style>
