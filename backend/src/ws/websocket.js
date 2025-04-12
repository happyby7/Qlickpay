const { Server } = require('socket.io');
require('dotenv').config();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
let io;

const initWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins, 
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado');
    console.log(`Total de conexiones activas: ${io.engine.clientsCount}`);

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
      console.log(`Conexiones activas restantes: ${io.engine.clientsCount}`);
    });
  });
  
  return {newOrderEvent, updateStatusTable };
};

const newOrderEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }else{
    console.error('WebSocket io no inicializado');
  }
};

const updateStatusTable = (event, data) => {
  if (io) {
    io.emit(event, data);
  }else{
    console.error('WebSocket io no inicializado');
  }
};

module.exports = { initWebSocket, newOrderEvent, updateStatusTable };
