# Stage 1: Build the app
FROM node:alpine AS builder

WORKDIR /app

# Copy package files first to leverage layer caching
COPY package.json yarn.lock ./
COPY tsconfig.json ./
COPY ./docker/rpc-proxy/adjust-packages.sh ./adjust-packages.sh
COPY default-proxy-config.json ./default-proxy-config.json

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source files
COPY src ./src

# Build the app
RUN yarn build

# Clean the package.json files ready for production
RUN apk add --no-cache jq
RUN chmod +x ./adjust-packages.sh
RUN /bin/sh ./adjust-packages.sh ./

# Stage 2: Production image
FROM node:alpine AS runner

# Install OpenSSL and clean up in a single layer
RUN apk update && \
    apk add --no-cache openssl && \
    apk upgrade --no-cache openssl && \
    openssl version && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN adduser -D rpc-proxy-user

# Set working directory first
WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules

USER rpc-proxy-user

# Environment variables
ENV RUNNING_WITH_DOCKER=true

# Start the application
CMD ["node", "dist/index.js"]
