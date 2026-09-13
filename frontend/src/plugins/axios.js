import axios from 'axios';

// La URL base se adapta al entorno mediante variables de entorno de Vite
// (sección 3.10 del enunciado). En Docker Compose se expone vía .env del frontend.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normaliza el error para que los servicios/composables reciban siempre
    // un mensaje legible, sin detalles técnicos innecesarios (HU-02, HU-11).
    const mensaje =
      error.response?.data?.mensaje ||
      'No fue posible comunicarse con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    const errores = error.response?.data?.errores || [];
    return Promise.reject({ mensaje, errores, status: error.response?.status });
  }
);

export default apiClient;
