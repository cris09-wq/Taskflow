# --- Etapa única: imagen ligera de producción ---
FROM node:20-alpine

WORKDIR /usr/src/app

# Copiamos primero los manifiestos para aprovechar la caché de capas de Docker.
COPY package*.json ./

RUN npm install --omit=dev

# Copiamos el resto del código fuente.
COPY . .

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/server.js"]
