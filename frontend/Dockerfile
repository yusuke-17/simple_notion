# Multi-stage build for React + Vite application

# Build stage
FROM node:22-alpine AS builder

# セキュリティ向上のためnon-rootユーザーを作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# セキュリティアップデートを適用
RUN apk upgrade --no-cache

# non-rootユーザーでnginxを実行するための設定
RUN addgroup -g 1001 -S nginx_user
RUN adduser -S nginx_user -u 1001

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginxの権限を適切に設定
RUN chown -R nginx_user:nginx_user /usr/share/nginx/html
RUN chown -R nginx_user:nginx_user /var/cache/nginx
RUN chown -R nginx_user:nginx_user /var/log/nginx
RUN chown -R nginx_user:nginx_user /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx_user:nginx_user /var/run/nginx.pid

# non-rootユーザーに切り替え
USER nginx_user

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
