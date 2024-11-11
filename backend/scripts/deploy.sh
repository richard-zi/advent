#!/bin/bash
# backend/scripts/deploy.sh

# Logging Funktion
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Fehlerbehandlung
set -e
trap 'log "Ein Fehler ist aufgetreten. Deployment abgebrochen."' ERR

# Projektverzeichnisse
BACKEND_DIR="C:/Users/admin/Documents/Adventskalender/backend"
FRONTEND_DIR="C:/Users/admin/Documents/Adventskalender/frontend/adventskalender"

# Stoppe aktuelle Server
log "Stoppe aktuelle Server..."
pm2 stop all

# Pull die neuesten Änderungen
log "Hole neueste Änderungen vom Repository..."
cd $BACKEND_DIR
git pull origin main
cd $FRONTEND_DIR
git pull origin main

# Backend Updates
log "Installiere Backend Dependencies..."
cd $BACKEND_DIR
npm install

# Frontend Updates
log "Installiere Frontend Dependencies..."
cd $FRONTEND_DIR
npm install
npm run build

# Starte Server neu
log "Starte Server neu..."
cd $BACKEND_DIR
pm2 start server.js

cd $FRONTEND_DIR
pm2 start "npm run start" --name "frontend"

log "Deployment erfolgreich abgeschlossen!"