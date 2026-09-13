import { onBeforeUnmount, ref } from 'vue';
import socket from '../plugins/socket';

/**
 * Composable para escuchar eventos de Socket.IO desde vistas o componentes,
 * registrando y retirando listeners automáticamente (sección 21.4).
 *
 * Flujo: Socket.IO → useSocket.js → Store (Pinia) → Componentes → UI.
 */
export function useSocket() {
  const conectado = ref(socket.connected);
  const listenersRegistrados = [];

  function on(evento, callback) {
    socket.on(evento, callback);
    listenersRegistrados.push({ evento, callback });
  }

  function off(evento, callback) {
    socket.off(evento, callback);
  }

  function handleConnect() {
    conectado.value = true;
  }

  function handleDisconnect() {
    conectado.value = false;
  }

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);

  onBeforeUnmount(() => {
    listenersRegistrados.forEach(({ evento, callback }) => socket.off(evento, callback));
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
  });

  return { socket, conectado, on, off };
}
