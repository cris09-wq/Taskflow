import { computed, ref } from 'vue';

const temaGuardado = localStorage.getItem('taskflow-theme');
const temaOscuro = ref(temaGuardado === 'dark' || temaGuardado === null);

function aplicarTema() {
  document.documentElement.dataset.theme = temaOscuro.value ? 'dark' : 'light';
}

if (!temaGuardado) {
  localStorage.setItem('taskflow-theme', 'dark');
}

aplicarTema();

export function useTheme() {
  const etiquetaTema = computed(() => (temaOscuro.value ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'));

  function establecerTema(oscuro) {
    temaOscuro.value = oscuro;
    localStorage.setItem('taskflow-theme', oscuro ? 'dark' : 'light');
    aplicarTema();
  }

  function alternarTema() {
    establecerTema(!temaOscuro.value);
  }

  return { temaOscuro, etiquetaTema, alternarTema, establecerTema };
}
