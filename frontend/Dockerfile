# Build stage — gera os arquivos estáticos de produção (Vite). VITE_API_URL
# é lido em build time (import.meta.env), não em runtime — por isso vem como
# build arg, não variável de ambiente do container final.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime stage — serve os arquivos estáticos via Nginx, com fallback de
# rota para index.html (necessário para o roteamento client-side do
# react-router — sem isso, um refresh em /decks/5 daria 404 no Nginx).
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
