FROM node:18-alpine

# Install git and other dependencies
RUN apk add --no-cache git ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p media thumbnails messages polls assets /etc/nginx/conf.d

# Copy source code
COPY . .

# Fix script permissions and format
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
    echo 'mkdir -p "${MEDIA_PATH:-/app/media}" \\' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    "${THUMBNAILS_PATH:-/app/thumbnails}" \\' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    "${MESSAGES_PATH:-/app/messages}" \\' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    "${POLLS_PATH:-/app/polls}" \\' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    "${ASSETS_PATH:-/app/assets}"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'exec "$@"' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]