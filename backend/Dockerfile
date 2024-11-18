FROM node:18-alpine

WORKDIR /app

# Install git and dependencies for image processing
RUN apk add --no-cache git ffmpeg

# The rest will be handled by the command in docker-compose.yml