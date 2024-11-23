# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Create nginx config directory
RUN mkdir -p /etc/nginx/conf.d

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create entrypoint script
RUN echo '#!/bin/sh' > /usr/local/bin/docker-entrypoint.sh && \
    echo 'set -e' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'mkdir -p /etc/nginx/conf.d' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "Generating IP allowlist..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo ': > /etc/nginx/conf.d/allowed_ips.conf' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'if [ -n "$ALLOWED_IPS" ]; then' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    echo "$ALLOWED_IPS" | tr "," "\n" | while read -r ip; do' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '        echo "allow $ip;" >> /etc/nginx/conf.d/allowed_ips.conf' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    done' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'else' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    echo "allow all;" >> /etc/nginx/conf.d/allowed_ips.conf' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'fi' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'exec "$@"' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]