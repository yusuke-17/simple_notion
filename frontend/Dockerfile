# Multi-stage build for React + Vite application

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Set build-time environment variables
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy error page
COPY 50x.html /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-main.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nginx_user && \
    adduser -S nginx_user -u 1001 -G nginx_user

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx/{client_temp,proxy_temp,fastcgi_temp,uwsgi_temp,scgi_temp} && \
    mkdir -p /run && \
    chown -R nginx_user:nginx_user /usr/share/nginx/html && \
    chown -R nginx_user:nginx_user /var/cache/nginx && \
    chown -R nginx_user:nginx_user /run && \
    chown -R nginx_user:nginx_user /var/log/nginx

# Switch to non-root user
USER nginx_user

# Expose port 8080 (non-root user cannot bind to port 80)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
