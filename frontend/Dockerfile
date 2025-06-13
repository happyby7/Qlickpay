FROM node:20

WORKDIR /app

# Copia solo package.json y package-lock.json primero
COPY frontend/package*.json ./

RUN npm install 

# Copia el resto del código fuente después de instalar dependencias
COPY frontend/. .

RUN npm run build 

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

