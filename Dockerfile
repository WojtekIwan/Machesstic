# DOCKER FILE

# CLIENT
FROM node:22-alpine AS build-ui

WORKDIR /app/client

# INSTALING ALL CLIENT DEPENDENCIES
COPY client/package*.json ./
RUN npm install

# RUNNING CLIENT
COPY client/ ./
RUN npm run build

# SERVER
FROM node:22-alpine AS runner

WORKDIR /app/server

# INSTALING ALL SERVER DEPENDENCIES
COPY server/package*.json ./
RUN npm install --production

COPY server/ ./

COPY --from=build-ui /app/client/dist ./public

EXPOSE 3000
ENV NODE_ENV=production

# RUNNING SERVER
CMD ["node", "main_server.js"]