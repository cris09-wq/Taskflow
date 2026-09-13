import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/main.scss';

// Los plugins de axios y socket se importan en los módulos que los
// consumen directamente (services/requestService.js y composables/useSocket.js),
// ya que ambos exponen una instancia única (singleton) configurada.

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
