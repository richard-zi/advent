#!/bin/sh

# Generate allowed IPs configuration
echo "Generating IP allowlist..."
IFS=',' read -ra IPS <<< "$ALLOWED_IPS"
> /etc/nginx/allowed_ips.conf
for ip in "${IPS[@]}"; do
    echo "allow $ip;" >> /etc/nginx/allowed_ips.conf
done

# Check for updates from GitHub
if [ -n "$GITHUB_REPO" ] && [ -n "$GITHUB_BRANCH" ]; then
    echo "Checking for updates from GitHub..."
    if [ ! -d .git ]; then
        git init
        git remote add origin $GITHUB_REPO
    fi
    git fetch origin $GITHUB_BRANCH
    git reset --hard origin/$GITHUB_BRANCH
    npm install
    npm run build
    cp -r build/* /usr/share/nginx/html/
fi

exec "$@"