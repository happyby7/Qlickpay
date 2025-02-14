FROM node:20

WORKDIR /app

# Copia package.json y package-lock.json ANTES de copiar el resto del código
COPY backend/package*.json ./

# Instala las dependencias
RUN npm install

# Copia el código fuente después de instalar las dependencias
COPY backend/. .

# Expone el puerto
EXPOSE 5000

# Comando para iniciar el backend
CMD ["node", "src/server.js"]
