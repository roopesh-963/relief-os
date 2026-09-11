# ==============================================================================
# ReliefOS AI - Unified Multi-Stage Production Dockerfile
# Builds the Vite React frontend and serves it with the Node.js backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the React Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code and configuration
COPY index.html tsconfig.json vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY earth_cartoon.glb ./

# Build production bundle to /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Server Runtime (Single Unified Container)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install backend production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend application source
COPY backend/ ./

# Copy compiled frontend distribution from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
USER node

# Expose server port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the ReliefOS fullstack server
CMD ["node", "server.js"]
