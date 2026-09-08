FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY client/package.json ./client/
RUN npm ci --workspace client

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY client ./client
COPY package.json package-lock.json ./
RUN npm run build --workspace client

FROM nginx:alpine AS runtime
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
