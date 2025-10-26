# Base deps stage (dev deps included for prisma CLI)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY prisma ./prisma
RUN npx prisma generate

# Runtime stage (production deps only)
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY src ./src
COPY ../../packages ./packages
EXPOSE 8080
CMD ["node","src/server.js"]
