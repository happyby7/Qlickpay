FROM node:20

WORKDIR /app

# Copia solo package.json y package-lock.json primero
COPY frontend/package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente después de instalar dependencias
COPY frontend/. .

# Expone el puerto
EXPOSE 3000

# Inicia el frontend en modo desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
