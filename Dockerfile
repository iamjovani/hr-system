FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of your project files
COPY . .

# Create data directory and declare it as a volume
RUN mkdir -p data
VOLUME /app/data

# Fix permissions
RUN chown -R node:node /app

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3000
ENV DATA_DIR=/app/data

USER node
EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"]