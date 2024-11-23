FROM node:18-alpine

# Install git and other dependencies
RUN apk add --no-cache git ffmpeg

WORKDIR /app

# Create necessary directories and set permissions
RUN mkdir -p media thumbnails messages polls assets /etc/nginx/conf.d && \
    chown -R node:node /app && \
    chmod 755 /app && \
    chown -R node:node /etc/nginx/conf.d

# Switch to non-root user
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Create entrypoint script
USER root
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
    echo 'chown -R node:node /app/media /app/thumbnails /app/messages /app/polls /app/assets' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'exec su-exec node "$@"' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    apk add --no-cache su-exec

EXPOSE 5000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]