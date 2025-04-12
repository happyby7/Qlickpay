FROM node:20-slim

WORKDIR /app

# Copia package.json y package-lock.json ANTES de copiar el resto del código
COPY backend/package*.json ./

RUN npm install

# Copia el código fuente después de instalar las dependencias
COPY backend/. .

EXPOSE 5000

# Comando para iniciar el backend
CMD ["node", "src/server.js"]
