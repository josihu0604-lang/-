# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install Korean fonts for PDF generation
RUN apk add --no-cache \
    fontconfig \
    ttf-dejavu \
    && fc-cache -fv

# Create non-root user
RUN addgroup -g 1000 qetta && \
    adduser -D -u 1000 -G qetta qetta

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy application code
COPY --chown=qetta:qetta . .

# Create directories
RUN mkdir -p pdfs logs && \
    chown -R qetta:qetta pdfs logs

# Switch to non-root user
USER qetta

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]
