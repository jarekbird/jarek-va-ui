# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Accept build-time environment variables for Vite
# These are used during the build process and baked into the JavaScript bundle
ARG VITE_ELEVENLABS_AGENT_ENABLED
ARG VITE_ELEVENLABS_AGENT_URL
ARG VITE_ELEVENLABS_AGENT_ID
ARG VITE_ELEVENLABS_AGENT_PUBLIC
ARG VITE_API_BASE_URL

# Set as environment variables for the build
ENV VITE_ELEVENLABS_AGENT_ENABLED=${VITE_ELEVENLABS_AGENT_ENABLED}
ENV VITE_ELEVENLABS_AGENT_URL=${VITE_ELEVENLABS_AGENT_URL}
ENV VITE_ELEVENLABS_AGENT_ID=${VITE_ELEVENLABS_AGENT_ID}
ENV VITE_ELEVENLABS_AGENT_PUBLIC=${VITE_ELEVENLABS_AGENT_PUBLIC}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

