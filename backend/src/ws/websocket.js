const { Server } = require('socket.io');

let io;

const initWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', 
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });
  
  return {newOrderEvent};
};

const newOrderEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }else{
    console.error('WebSocket io no inicializado');
  }
};

module.exports = { initWebSocket, newOrderEvent };
