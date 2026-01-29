# Enterprise Backend Dockerfile
# Multi-stage build for production optimization

# Production-ready Multi-stage Dockerfile
# Optimized for enterprise deployment

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S corallum && \
    adduser -S corallum -u 1001 -G corallum

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=corallum:corallum /app/dist ./dist
COPY --from=builder --chown=corallum:corallum /app/node_modules ./node_modules
COPY --from=builder --chown=corallum:corallum /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/knowledge-base && \
    chown -R corallum:corallum /app

# Switch to non-root user
USER corallum

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# Expose port
EXPOSE 8003

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
