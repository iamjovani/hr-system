# Dockerfile
FROM node:18-alpine AS base

# Install dependencies needed for better-sqlite3
RUN apk add --no-cache python3 make g++ 

# Set working directory
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Create volume directory for SQLite database
RUN mkdir -p /app/data
VOLUME /app/data

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set proper permissions for the data directory
RUN chown -R node:node /app/data

# Switch to non-root user
USER node

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]