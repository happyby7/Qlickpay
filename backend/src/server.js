const app = require("./app");
const http = require("http");
const { initWebSocket } = require("./ws/websocket");
require("dotenv").config(); 

const API_PORT = process.env.PORT;
const WS_PORT = process.env.WS_PORT; 

process.on("unhandledRejection", (err) => {
 console.error("Error no manejado:", err);
});
  
process.on("uncaughtException", (err) => {
 console.error("Excepción no capturada:", err);
});

const server = http.createServer(app);

server.listen(API_PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor API corriendo en http://0.0.0.0:${API_PORT}`);
}).on("error", (err) => {
    console.error("Error al iniciar el servidor API:", err);
});


const wsServer = http.createServer();
global.websocket = initWebSocket(wsServer);

wsServer.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`📡 WebSocket en ws://0.0.0.0:${WS_PORT}`);
}).on("error", (err) => {
    console.error("Error al iniciar WebSocket:", err);
});
