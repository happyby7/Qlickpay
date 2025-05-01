import { writable } from 'svelte/store';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const newOrders = createPersistentNewOrders();
export const tableStatuses = writable<Record<number, string>>({});
export const billUpdates = writable(0);

function createPersistentNewOrders() {
  let initial: Record<number, number> = {};
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem('newOrders');
    if (stored) {
      try {
        initial = JSON.parse(stored);
      } catch (e) {
        console.error("Error al parsear newOrders almacenado:", e);
      }
    }
  }
  const store = writable<Record<number, number>>(initial);
  store.subscribe((value) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('newOrders', JSON.stringify(value));
    }
  });
  return store;
}

export const connectWebSocket = () => {
  if (socket) return; 

  const wsProtocol = location.protocol === "https:" ? "wss://" : "ws://";
  const wsHost = import.meta.env.VITE_WS_URL.replace(/^http(s)?:\/\//, "").split(":")[0];
  const wsPort = "5001";
  const wsUrl = `${wsProtocol}${wsHost}:${wsPort}`;

  socket = io(wsUrl, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('🔌 WebSocket conectado');
    socket?.emit("message", "🟢 Conectado al WebSocket");
  });

  socket.on('newOrder', (data: string) => {
    try {
      const { tableId } = JSON.parse(data);
      newOrders.update((counts) => {
        counts[tableId] = (counts[tableId] || 0) + 1;
        return { ...counts };
      });
    } catch (error) {
      console.error("Error al procesar el mensaje:", error);
    }
  });

  socket.on('updateTableStatus', (data: string) => {
    try {
      const { tableId, status } = JSON.parse(data);
      tableStatuses.update((current) => {
        current[tableId] = status;
        return { ...current };
      });
    } catch (error) {
      console.error("Error al procesar updateTableStatus:", error);
    }
  });

  socket.on('updateBill', (data: string) => {
    try {
      const { tableId } = JSON.parse(data);
      billUpdates.update(n => n + 1);
    } catch (e) {
      console.error('Error procesando updateBill:', e);
    }
  });

  socket.on('disconnect', () => {
    console.warn("❌ WebSocket desconectado");
  });

  socket.on('error', (error: any) => {
    console.error('⚠️ Error en WebSocket:', error);
  });
};
