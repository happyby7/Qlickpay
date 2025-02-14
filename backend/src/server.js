const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error("❌ Error al iniciar el servidor:", err);
});
