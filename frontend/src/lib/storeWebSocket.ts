import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

export const newOrders = writable<Record<number, number>>({});

export const connectWebSocket = () => {
  const wsProtocol = location.protocol === "https:" ? "wss://" : "ws://";
  const wsHost = import.meta.env.VITE_WS_URL.replace(/^http(s)?:\/\//, "").split(":")[0];
  const wsPort = "5001";
  const wsUrl = `${wsProtocol}${wsHost}:${wsPort}`;
  
  const socket = io(wsUrl, { transports: ['websocket'] });

  socket.on('connect', () => {
    socket.emit("message", "🟢 Conectado al WebSocket");
    console.log('🟢 Conectado al WebSocket');
  });

  socket.on('newOrder', (data: string) => {
    try {
      const { tableId } = JSON.parse(data) as { tableId: number };
      newOrders.update((counts) => {
        counts[tableId] = (counts[tableId] || 0) + 1;
        return { ...counts };
      });
    } catch (error) {
      console.error("Error al procesar el mensaje:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Conexión WebSocket cerrada');
  });

  socket.on('error', (error: any) => {
    console.error('⚠️ Error en WebSocket:', error);
  });
};
