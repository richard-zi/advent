# Adventskalender - NextJS App

Ein digitaler Adventskalender mit 24 Türchen, komplett refactored in NextJS 14 mit TypeScript.

## 🎄 Features

- **24 Türchen** mit verschiedenen Content-Typen:
  - Text (Markdown-Support)
  - Bilder
  - Videos
  - Audio
  - GIFs
  - Umfragen (Polls)
  - Puzzle-Spiele
  - Countdown
  - iFrames (z.B. YouTube)

- **Admin-Panel** zur Verwaltung aller Inhalte
- **Dark Mode** mit localStorage-Persistierung
- **Zeitbasierte Freischaltung** der Türchen
- **Thumbnail-Generierung** für Medien
- **Cache-System** für optimale Performance
- **TypeScript** für Type-Safety
- **Tailwind CSS** für modernes Design

## 📁 Projektstruktur

```
advent/
├── app/                          # NextJS App Router
│   ├── api/                      # API Routes
│   │   ├── route.ts              # Haupt-API (alle Türchen)
│   │   ├── media/[index]/        # Media-Dateien
│   │   ├── poll/[doorNumber]/    # Poll-API
│   │   └── admin/                # Admin-API Routes
│   ├── admin/                    # Admin-Seite
│   └── page.tsx                  # Hauptseite (Kalender)
├── components/                   # React-Komponenten
│   └── admin/                    # Admin-Komponenten
├── lib/                          # Backend-Logik
│   ├── config/                   # Konfiguration
│   ├── middleware/               # Auth-Middleware
│   ├── services/                 # Business-Logik
│   │   ├── authService.ts
│   │   ├── cacheService.ts
│   │   ├── mediaService.ts
│   │   ├── pollService.ts
│   │   ├── thumbnailService.ts
│   │   └── timingService.ts
│   ├── types/                    # TypeScript-Typen
│   └── utils/                    # Hilfsfunktionen
├── data/                         # Daten-Verzeichnis
│   ├── medium.json               # Türchen-Konfiguration
│   ├── admin-credentials.json    # Admin-Zugangsdaten
│   ├── messages/                 # Zusätzliche Nachrichten
│   └── polls/                    # Umfrage-Daten
└── public/                       # Statische Dateien
    ├── media/                    # Hochgeladene Medien
    ├── thumbnails/               # Generierte Thumbnails
    └── assets/                   # Assets (puzzle.jpg, etc.)
```

## 🚀 Setup

### Voraussetzungen

- Node.js 18+
- FFmpeg (für Video-/Audio-Verarbeitung)
- npm oder yarn

### Installation

1. **Dependencies installieren:**
```bash
cd advent
npm install
```

2. **Environment-Variablen konfigurieren:**

Erstelle eine `.env.local` Datei:

```env
# JWT Secret (wichtig für Production!)
JWT_SECRET=dein-sicherer-secret-key

# Admin-Zugangsdaten
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dein-sicheres-passwort

# FFmpeg Pfade (anpassen für dein System)
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Optional
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=52428800
THUMBNAIL_WIDTH=500
THUMBNAIL_QUALITY=85
```

### FFmpeg Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
- Download von https://ffmpeg.org/download.html
- Pfade in `.env.local` anpassen

### Assets kopieren

Kopiere das puzzle.jpg Asset aus dem alten Backend:
```bash
mkdir -p public/assets
cp ../backend/assets/puzzle.jpg public/assets/
```

## 🏃 Development

```bash
npm run dev
```

App läuft auf http://localhost:3000

- **Hauptseite:** http://localhost:3000
- **Admin-Panel:** http://localhost:3000/admin

## 📦 Production Build

```bash
npm run build
npm start
```

## 🔐 Admin-Zugang

1. Gehe zu http://localhost:3000/admin
2. Login mit konfigurierten Zugangsdaten
3. Inhalte hochladen und verwalten

### Content-Typen hochladen

- **Text:** Markdown-formatierter Text
- **Bild/Video/Audio:** Datei-Upload
- **Poll:** Frage + 4 Optionen
- **Puzzle:** Bild hochladen → wird zum Schiebepuzzle
- **Countdown:** Countdown bis Weihnachten
- **iFrame:** URL eingeben (z.B. YouTube-Link)

## 🔧 API-Endpoints

### Public Endpoints

- `GET /api` - Alle Türchen-Daten
- `GET /api/media/[index]` - Media-Datei abrufen
- `GET /api/poll/[doorNumber]` - Poll-Daten
- `POST /api/poll/[doorNumber]/vote` - Abstimmen

### Admin Endpoints (Auth erforderlich)

- `POST /api/admin/login` - Admin-Login
- `GET /api/admin/verify` - Token verifizieren
- `GET /api/admin/doors` - Alle Türchen
- `GET /api/admin/polls` - Alle Polls
- `POST /api/admin/upload/[doorNumber]` - Content hochladen
- `DELETE /api/admin/content/[doorNumber]` - Content löschen
- `GET /api/admin/cache` - Cache-Timestamp
- `POST /api/admin/cache` - Cache leeren

## 📝 Wichtige Services

### TimingService
- Kontrolliert zeitbasierte Freischaltung
- Start: 1. Dezember 2024
- Türchen öffnen sich täglich

### MediaService
- Verwaltet alle Media-Uploads
- Unterstützt verschiedene Content-Typen
- Automatische Thumbnail-Generierung

### PollService
- Verwaltet Umfragen
- Verhindert Mehrfach-Abstimmung
- Speichert Ergebnisse

### AuthService
- JWT-basierte Authentifizierung
- Bcrypt-Passwort-Hashing
- 24h Token-Gültigkeit

## 🎨 Verbesserungen gegenüber Original

1. **TypeScript** - Vollständige Type-Safety
2. **NextJS 14** - Moderne App Router Architecture
3. **Vereinheitlichte Struktur** - Frontend + Backend in einem Projekt
4. **API Routes** - Klare REST-API-Struktur
5. **Bessere Fehlerbehandlung** - Robustere Error-Handler
6. **Modularer Code** - Bessere Trennung von Concerns
7. **Type-Definitionen** - Alle Typen zentral definiert

## 🔄 Migration vom alten Projekt

### Daten übertragen:

```bash
# Medium.json kopieren
cp ../backend/medium.json data/

# Media-Dateien kopieren
cp -r ../backend/media/* public/media/

# Messages kopieren (falls vorhanden)
cp -r ../backend/messages/* data/messages/

# Poll-Daten kopieren (falls vorhanden)
cp ../backend/polls/* data/polls/
```

## 🐛 Bekannte Limitierungen

- Noch nicht alle Original-Components konvertiert
- Snowfall-Animation fehlt noch
- Einige erweiterte Features aus dem Original fehlen

## 📚 Weitere Komponenten hinzufügen

Um weitere Komponenten aus dem Original zu übernehmen:

1. Component aus `frontend/adventskalender/src/components/` nehmen
2. Nach TypeScript konvertieren
3. In `components/` ablegen
4. In relevanten Pages importieren

Beispiel:
```tsx
// components/Snowfall.tsx
'use client';
import { useEffect, useRef } from 'react';

export default function Snowfall({ isActive }: { isActive: boolean }) {
  // ... Implementation
}
```

## 🤝 Contributing

Weitere Verbesserungen willkommen!

## 📄 License

Privates Projekt
