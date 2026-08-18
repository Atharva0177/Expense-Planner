# Multi-stage Docker build for optimized production image
# Stage 1: Build frontend and server bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package dependency manifests
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy full application source
COPY . .

# Build the client static assets and server bundle
RUN npm run build

# Stage 2: Minimal production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Expose application port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
