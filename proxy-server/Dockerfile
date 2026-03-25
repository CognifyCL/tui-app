# Usamos una imagen de Node.js liviana pero con herramientas de compilación
# node-pty necesita compilar módulos nativos de C++
FROM node:22-slim

# Instalamos dependencias del sistema necesarias para node-pty y tmux
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    tmux \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install --production

# Copiamos el resto del código
COPY . .

# El proxy corre en el 3000 por defecto
EXPOSE 3000

# Iniciamos el proxy
CMD ["npm", "start"]
