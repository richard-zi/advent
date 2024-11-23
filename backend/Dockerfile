FROM node:18-alpine

# Install git and other dependencies
RUN apk add --no-cache git ffmpeg dos2unix

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p media thumbnails messages polls assets /etc/nginx/conf.d

# Copy source code
COPY . .

# Convert line endings and set permissions
RUN dos2unix docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh && \
    mv docker-entrypoint.sh /usr/local/bin/

EXPOSE 5000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]