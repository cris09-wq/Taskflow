import { io } from 'socket.io-client';

// Configura y expone una única instancia de conexión Socket.IO para
// toda la aplicación (sección 21.4 del enunciado).
const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const socket = io(socketURL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

socket.on('connect', () => {
  console.log('[Socket.IO] Conectado al backend:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket.IO] Desconectado del backend:', reason);
});

socket.on('connect_error', (err) => {
  console.error('[Socket.IO] Error de conexión:', err.message);
});

export default socket;
