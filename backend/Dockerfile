FROM node:18-alpine

# Install git and other dependencies
RUN apk add --no-cache git ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p media thumbnails messages polls assets

# Create nginx config directory
RUN mkdir -p /etc/nginx/conf.d

# Copy source code
COPY . .

# Add startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]