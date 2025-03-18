const app = require("./app");
const http = require("http");
const { initWebSocket } = require("./ws/websocket");

const API_PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 5001; 

const server = http.createServer(app);

server.listen(API_PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor API corriendo en http://0.0.0.0:${API_PORT}`);
}).on("error", (err) => {
    console.error("❌ Error al iniciar el servidor API:", err);
});


const wsServer = http.createServer();
global.websocket = initWebSocket(wsServer);

wsServer.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor WebSocket corriendo en ws://0.0.0.0:${WS_PORT}`);
});
