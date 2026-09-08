FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace server

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
COPY package.json package-lock.json ./
RUN npm run build --workspace server

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY server/package.json ./server/
EXPOSE 4000
CMD ["node", "server/dist/server.js"]
