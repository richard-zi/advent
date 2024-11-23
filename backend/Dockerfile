FROM node:18-alpine

# Install git and other dependencies
RUN apk add --no-cache git ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p media thumbnails messages polls assets

# Add startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Add IP filtering configuration
COPY nginx-backend.conf /etc/nginx/conf.d/default.conf

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]