#!/bin/sh

# Create directories if they don't exist
mkdir -p /app/media
mkdir -p /app/thumbnails
mkdir -p /app/messages
mkdir -p /app/polls
mkdir -p /app/assets

# Set correct permissions
chown -R node:node /app/media
chown -R node:node /app/thumbnails
chown -R node:node /app/messages
chown -R node:node /app/polls
chown -R node:node /app/assets

# Execute CMD
exec "$@"