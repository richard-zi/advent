# backend/docker-entrypoint.sh
#!/bin/sh
set -e

# Create nginx config directory if it doesn't exist
mkdir -p /etc/nginx/conf.d

# Generate allowed IPs configuration
echo "Generating IP allowlist..."
: > /etc/nginx/conf.d/allowed_ips.conf
if [ -n "$ALLOWED_IPS" ]; then
    echo "$ALLOWED_IPS" | tr ',' '\n' | while read -r ip; do
        echo "allow $ip;" >> /etc/nginx/conf.d/allowed_ips.conf
    done
else
    echo "allow all;" >> /etc/nginx/conf.d/allowed_ips.conf
fi

# Check for updates from GitHub
if [ -n "$GITHUB_REPO" ] && [ -n "$GITHUB_BRANCH" ]; then
    echo "Checking for updates from GitHub..."
    if [ ! -d .git ]; then
        git init
        git remote add origin "$GITHUB_REPO"
    fi
    git fetch origin "$GITHUB_BRANCH"
    git reset --hard "origin/$GITHUB_BRANCH"
    npm install
fi

# Create required directories
mkdir -p \
    "${MEDIA_PATH:-/app/media}" \
    "${THUMBNAILS_PATH:-/app/thumbnails}" \
    "${MESSAGES_PATH:-/app/messages}" \
    "${POLLS_PATH:-/app/polls}" \
    "${ASSETS_PATH:-/app/assets}"

exec "$@"