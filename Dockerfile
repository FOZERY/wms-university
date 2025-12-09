# Stage 1: Dependencies
FROM node:22.20.0-alpine AS dependencies

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production --silent && npm cache clean --force

# Stage 2: Build
FROM node:22.20.0-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --silent

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:22.20.0-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
	adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Copy package.json for metadata
COPY --chown=nestjs:nodejs package*.json ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]