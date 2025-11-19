# Advent Calendar Codebase Documentation

## Overview
This is a **Next.js 14** based digital advent calendar application with dynamic content management, puzzle games, polls, and admin controls. It's designed for 24 doors (December 1-24) with various content types (text, images, videos, audio, puzzles, polls, iframes, countdowns).

---

## 1. Project Structure

### Directory Organization
```
advent/
├── app/                          # Next.js app directory (server & client components)
│   ├── admin/                   # Admin dashboard
│   │   └── page.tsx            # Admin login & panel interface
│   ├── api/                     # API routes
│   │   ├── admin/              # Admin-only endpoints
│   │   ├── doors/              # Door content endpoints
│   │   ├── media/              # Media file serving
│   │   ├── poll/               # Poll endpoints
│   │   ├── settings/           # Settings endpoints
│   │   └── route.ts            # Main API endpoint (GET all doors)
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Main calendar page
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── admin/                  # Admin-specific components
│   ├── ContentModal.tsx        # Door content display modal
│   ├── PuzzleGame.tsx          # Puzzle game component
│   ├── Snowfall.tsx            # Animated snowfall effect
│   ├── Confetti.tsx            # Confetti animation
│   └── [other visual components]
├── lib/
│   ├── config/
│   │   ├── env.ts              # Environment variables & validation
│   │   └── paths.ts            # File system paths
│   ├── middleware/
│   │   └── auth.ts             # JWT & CSRF authentication
│   ├── services/
│   │   ├── authService.ts      # JWT, bcrypt password hashing
│   │   ├── mediaService.ts     # Media file & content management
│   │   ├── thumbnailService.ts # Thumbnail generation
│   │   ├── settingsService.ts  # Calendar settings
│   │   ├── pollService.ts      # Poll data & votes
│   │   ├── timingService.ts    # Door availability timing
│   │   ├── cacheService.ts     # Cache invalidation
│   │   └── initService.ts      # Initialization & setup
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── utils/
│   │   ├── fileUtils.ts        # File operations
│   │   ├── logger.ts           # Logging utility
│   │   └── utils.ts            # CN classname utility
│   └── types/index.ts
├── public/
│   ├── media/                  # User-uploaded media files
│   ├── thumbnails/             # Generated thumbnails
│   └── assets/                 # Static assets
├── data/                       # Runtime data (created on init)
│   ├── messages/               # Door message files (*.txt)
│   ├── polls/                  # Poll definitions
│   ├── medium.json             # Media index
│   ├── admin-credentials.json  # Hashed admin credentials
│   └── settings.json           # Calendar settings
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.mjs
└── components.json             # shadcn CLI config
```

---

## 2. Technology Stack

### Core Framework
- **Next.js 14.2.33** - React meta-framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5** - Type safety

### UI & Styling
- **Tailwind CSS 3.4.13** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library (Radix UI based)
- **Lucide React 0.451.0** - Icon library
- **Framer Motion 11.11.8** - Animation library
- **next-themes** - Dark mode support
- **class-variance-authority** - Component variant system

### Backend & Data
- **Express.js** (via Next.js API routes)
- **fs/fs-promises** - File system operations
- **Path module** - File path utilities

### Media Processing
- **Sharp 0.33.5** - Image processing & resizing
- **ffmpeg/fluent-ffmpeg 2.1.3** - Video processing
- **@napi-rs/canvas 0.1.81** - Canvas for thumbnail generation

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT token management
- **bcryptjs 3.0.2** - Password hashing (10-12 rounds)
- **crypto** (Node.js built-in) - CSRF tokens, timing-safe comparison

### Content & Utilities
- **react-markdown 9.1.0** - Markdown rendering
- **remark-gfm 4.0.1** - GitHub Flavored Markdown support
- **axios 1.7.7** - HTTP requests
- **react-hook-form 7.65.0** - Form state management
- **zod 4.1.12** - Schema validation
- **react-confetti 6.1.0** - Confetti animation
- **MDXEditor 3.48.0** - Markdown content editor

---

## 3. Architecture Patterns

### Project Architecture: Next.js App Router Pattern
- **Server Components** (default) - Used for API routes and data fetching
- **Client Components** (`'use client'` directive) - For interactive UI

### API Structure: RESTful Pattern with Nested Routes
```
GET  /api                           # Get all doors with thumbnails & metadata
GET  /api/doors/:doorNumber         # Get single door content
GET  /api/settings                  # Get calendar settings
GET  /api/media/:index              # Serve media files (images/videos/audio)
POST /api/admin/login               # Authentication
GET  /api/admin/verify              # Verify auth status
POST /api/admin/logout              # Clear session
GET  /api/admin/doors               # List all doors (admin)
POST /api/admin/upload/:doorNumber  # Upload content (admin)
POST /api/admin/settings            # Update settings (admin)
GET  /api/poll/:doorNumber          # Get poll data
POST /api/poll/:doorNumber/vote     # Cast vote
```

### Service Layer Architecture
- **AuthService** - JWT generation, password validation
- **MediaService** - File operations, content preparation
- **ThumbnailService** - Dynamic thumbnail generation for all content types
- **SettingsService** - Calendar configuration (start date, title)
- **PollService** - Poll CRUD, vote tracking
- **TimingService** - Door availability checking based on dates
- **FileUtils** - Cross-platform file operations
- **InitService** - Bootstrap application state

### Component Architecture
- **Page Components** - Full-screen pages (Home, Admin)
- **Modal Components** - ContentModal for door display
- **Feature Components** - PuzzleGame, Snowfall, Confetti
- **UI Components** - Reusable shadcn/ui components
- **Specialized Components** - ChristmasBorder, ChristmasLights

### State Management
- **useState** hooks for local component state
- **localStorage** for client-side persistence:
  - `doorOrder` - Shuffled door array (Fisher-Yates)
  - `openedDoors` - Opened door tracking
  - `doorStates` - Puzzle solved status
  - `showSnow` - Snow preference
  - `adventCalendarUserId` - Anonymous poll voter ID

### Data Flow

#### Frontend Data Flow
```
page.tsx (Home)
  ├─ Fetch /api/settings
  ├─ Fetch /api (all doors with thumbnails)
  ├─ onClick door → Fetch /api/doors/:doorNumber
  │  └─ Display in ContentModal
  └─ Poll/Puzzle interaction → API calls
```

#### Backend Data Flow
```
POST /api/admin/upload/:doorNumber
  ├─ AuthService.verifyToken()
  ├─ MediaService.savePuzzleData/saveTextContent()
  ├─ ThumbnailService.generateThumbnail()
  ├─ Update medium.json
  └─ Update messages/:doorNumber.txt

GET /api/doors/:doorNumber
  ├─ TimingService.dateCheck()
  ├─ FileUtils.getFileType()
  ├─ MediaService.prepareMediaContent()
  ├─ ThumbnailService.generateThumbnail()
  ├─ MediaService.getMediaMessage()
  └─ Return DoorContent
```

---

## 4. Key Features

### Public Features
1. **24-Door Calendar Grid**
   - Responsive grid (4 columns on mobile, 6 on tablet/desktop)
   - Fisher-Yates shuffle algorithm for random door ordering
   - Door availability based on calendar date
   - Dark/Light mode support

2. **Content Types**
   - Text with Markdown rendering
   - Images (JPEG, PNG, WebP)
   - Videos (MP4, WebM, MOV)
   - Audio (MP3, WAV, OGG)
   - Animated GIFs
   - Polls with voting
   - Puzzle games
   - Countdowns
   - iFrames (e.g., YouTube, embedded content)

3. **Interactive Features**
   - Puzzle game with solution submission
   - Real-time poll voting
   - Confetti animations
   - Animated snowfall
   - Modal-based content viewing

4. **Theming**
   - System theme detection
   - Manual theme toggle
   - Christmas-themed colors (red, green, gold)
   - Theme-specific thumbnails (light/dark)

### Admin Features
1. **Admin Panel**
   - Login with username/password
   - Door content management (upload/edit)
   - Poll creation
   - Calendar settings (start date, title)
   - Media upload with automatic thumbnail generation

2. **Authentication**
   - JWT tokens (24-hour expiry)
   - CSRF protection on mutating operations
   - Rate limiting on login (5 attempts/15 min)
   - Secure password hashing (bcryptjs)

3. **Content Management**
   - Upload multiple file types
   - Auto-generate theme-aware thumbnails
   - Message/description for each door
   - Direct text editing

---

## 5. File Naming Conventions

### Components
- **Page Components**: PascalCase, suffix with filename (e.g., `page.tsx`)
- **Feature Components**: PascalCase (e.g., `ContentModal.tsx`, `PuzzleGame.tsx`)
- **UI Components**: lowercase, descriptive (e.g., `button.tsx`, `dialog.tsx`)

### API Routes
- **Bracket notation** for dynamic segments: `[doorNumber]`, `[index]`
- **route.ts** for endpoint handlers
- **Directory structure mirrors URL path**

### Services
- **Suffix**: `Service` (e.g., `authService.ts`, `mediaService.ts`)
- **Class-based** with static methods
- **PascalCase class names**, camelCase file names

### Types
- **index.ts** in `/lib/types/` for all TypeScript definitions
- **Type names**: PascalCase (e.g., `DoorContent`, `PollVoteRecord`)

### Configuration Files
- **.ts/.mjs extensions** for config
- **kebab-case**: `admin-credentials.json`, `poll-data.json`
- **camelCase**: `medium.json`, `settings.json`

### Utilities
- **Descriptive lowercase**: `fileUtils.ts`, `logger.ts`
- **Class-based** with static methods where appropriate

---

## 6. Code Patterns

### Common Patterns Used

#### 1. Service Pattern with Static Methods
```typescript
export class AuthService {
  static async validateCredentials(username: string, password: string): Promise<boolean>
  static generateToken(username: string): string
}
```

#### 2. React Hooks Pattern
```typescript
const [doors, setDoors] = useState<DoorContent[]>([]);
const { resolvedTheme, setTheme } = useTheme();
```

#### 3. Error Handling Pattern
```typescript
try {
  // operation
} catch (error) {
  logger.error('Context:', error);
  return defaultValue || null;
}
```

#### 4. Type Safety with TypeScript
```typescript
interface DoorContent {
  data: string | null;
  type: ContentType;
  // ...
}
```

#### 5. Middleware Authentication Wrapper
```typescript
export function withAuth(handler: (...) => Promise<NextResponse>) {
  return async (request, context) => {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: '...' }, { status: 401 });
    }
    return handler(request, context);
  };
}
```

#### 6. Dynamic Content Rendering
```typescript
const renderContent = () => {
  switch (door.type) {
    case 'puzzle': return <PuzzleGame />;
    case 'poll': return <PollComponent />;
    // ...
  }
};
```

#### 7. Responsive Grid Layout
```tsx
<div className="grid grid-cols-4 sm:grid-cols-6 gap-2 md:gap-3">
```

#### 8. Next.js Cache Control
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache headers for optimization
headers: {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}
```

---

## 7. Configuration Files

### `package.json`
- Main dependencies for Next.js, React, UI libraries
- Dev dependencies for TypeScript, ESLint, Tailwind
- Build scripts: `dev`, `build`, `start`, `lint`

### `tsconfig.json`
- Target ES2017, DOM + ESNext libraries
- Path alias: `@/*` → root directory
- JSX preserved for Next.js compilation
- Strict mode enabled

### `tailwind.config.js`
- Extended colors: Christmas-themed (red, green, gold)
- Custom animations: pulse-slow, shimmer, float, glow
- Custom keyframes and utilities
- Plugins: @tailwindcss/typography, tailwind-scrollbar

### `next.config.mjs`
- Server actions: 50MB body size limit
- Image domains: localhost + HTTPS pattern
- Webpack config for native modules (@napi-rs/canvas)
- Node loader for .node files

### `components.json`
- shadcn CLI configuration
- Tailwind CSS integration
- Base color: neutral
- Icon library: lucide

### Environment Variables (`.env`)
```
JWT_SECRET              # Required for token signing
FFMPEG_PATH            # Path to ffmpeg binary
FFPROBE_PATH           # Path to ffprobe binary
ADMIN_USERNAME         # Default: 'admin'
ADMIN_PASSWORD         # Default: 'admin' (change in production!)
NODE_ENV               # development/production
PORT                   # Default: 3000
ALLOWED_ORIGINS        # CORS origins
MAX_FILE_SIZE          # Default: 50MB
THUMBNAIL_WIDTH        # Default: 500px
THUMBNAIL_QUALITY      # Default: 85
GITLAB_WEBHOOK_SECRET  # Optional webhook support
```

---

## 8. API Structure

### Authentication Endpoints
```
POST /api/admin/login      - Login with credentials, returns JWT + CSRF token
POST /api/admin/logout     - Logout (clears cookies)
GET  /api/admin/verify     - Verify authentication status
```

### Main Calendar API
```
GET /api                   - Fetch all 24 doors with thumbnails
                            Query params: doorStates (JSON string)
                            Returns: Record<doorNumber, DoorContent>

GET /api/doors/:doorNumber - Fetch single door content
                            Query params: doorStates (JSON string)
                            Returns: DoorContent

GET /api/settings         - Fetch calendar settings
                            Returns: { startDate, title }

GET /api/media/:index     - Serve media file (image/video/audio)
```

### Admin Content Management
```
GET  /api/admin/doors              - List all doors (admin only)
GET  /api/admin/doors/:doorNumber  - Get door for editing
POST /api/admin/upload/:doorNumber - Upload media/text/puzzle
POST /api/admin/content/:doorNumber - Update door content
DELETE /api/admin/doors/:doorNumber - Delete door content

POST /api/admin/settings           - Update calendar settings
POST /api/admin/cache              - Invalidate cache
```

### Poll API
```
GET  /api/poll/:doorNumber        - Get poll data & user's vote
POST /api/poll/:doorNumber/vote   - Submit vote
```

### Caching Strategy
- **10-second TTL** on main API for fast updates
- **60-second s-maxage** for CDN caching
- **No-cache headers** on poll/door-specific endpoints
- **Cache invalidation** via CacheService

---

## 9. Component Structure

### Page Components
- **page.tsx** (Home) - Main calendar grid, 870 lines
  - Door state management
  - Modal display logic
  - Theme toggle
  - localStorage persistence

- **admin/page.tsx** - Admin login & panel interface

### Modal & Dialog Components
- **ContentModal.tsx** - Display door content
  - Markdown rendering
  - Media playback controls
  - Poll voting interface
  - Puzzle game embedding
  - Confetti effect trigger

- **Dialog** (shadcn/ui) - Base modal component

### Feature Components
- **PuzzleGame.tsx** - Interactive puzzle solver
- **Snowfall.tsx** - Animated snow particle effect
- **MinimalSnowflakes.tsx** - Lightweight snow variant
- **Confetti.tsx** - Celebration confetti effect
- **ChristmasLights.tsx** - Decorative light animation
- **ChristmasBorder.tsx** - Border decoration

### UI Components (shadcn/ui)
- **button.tsx** - Interactive buttons
- **card.tsx** - Container component
- **dialog.tsx** - Modal dialog
- **input.tsx** - Text input
- **label.tsx** - Form labels
- **avatar.tsx** - Avatar display
- **badge.tsx** - Status badge
- **separator.tsx** - Visual divider
- **sheet.tsx** - Mobile menu
- **tabs.tsx** - Tab navigation
- **form.tsx** - Form utilities

### Admin Components
- **AdminPanel.tsx** - Main admin interface

---

## 10. Services & Utilities

### AuthService
**Methods:**
- `initializeAdmin()` - Create admin credentials if missing
- `validateCredentials(username, password)` - Verify login
- `generateToken(username)` - Create JWT token
- `verifyToken(token)` - Validate JWT

**Security Features:**
- Bcrypt hashing (10-12 salt rounds)
- JWT with 24-hour expiry
- CSRF token generation

### MediaService
**Methods:**
- `getMediaFile(index)` - Retrieve media file path
- `getMediaMessage(index)` - Get message text
- `updateMessage(index, message)` - Update message
- `prepareMediaContent()` - Format content for API response
- `saveTextContent()`, `savePuzzleData()`, `savePollMarker()`, `saveIframeContent()`, `saveCountdownContent()` - Content persistence
- `deleteContent(doorNumber)` - Remove all associated files

**Content Type Support:**
- Text, Image, Video, GIF, Audio, Poll, Puzzle, Countdown, iFrame, "not available yet"

### ThumbnailService
**Methods:**
- `generateThumbnail()` - Create light/dark variants
- Type-specific generators:
  - `generateTextThumbnails()` - Markdown preview with Canvas
  - `generateImageThumbnails()` - Image resizing with Sharp
  - `generatePuzzleThumbnails()` - Puzzle image or asset
  - `generatePollThumbnails()` - Bar chart with Canvas
  - `generateAudioThumbnails()` - Waveform with Canvas
  - `generateCountdownThumbnails()` - Clock icon with Canvas
  - `generateMediaThumbnails()` - Video frame extraction with FFmpeg
  - `generateIframeThumbnails()` - YouTube thumbnails or fallback
  - `generateGifThumbnails()` - First frame extraction

### SettingsService
**Methods:**
- `getSettings()` - Load calendar settings
- `saveSettings()` - Persist settings
- `getStartDate()` - Get calendar start date

**Default Settings:**
```typescript
{
  startDate: '2024-12-01',
  title: 'Adventskalender 2024'
}
```

### PollService
**Methods:**
- `getPollData(doorNumber)` - Get poll question/options
- `savePollData(doorNumber, pollData)` - Create poll
- `getVotes(doorNumber)` - Get current vote counts
- `getUserVote(doorNumber, userId)` - Check if user voted
- `vote(doorNumber, option, userId)` - Record vote
- `deletePoll(doorNumber)` - Remove poll

**Voting Logic:**
- Anonymous voting (userId tracked in localStorage)
- One vote per user per poll
- Vote counts stored in pollVotes.json

### TimingService
**Methods:**
- `dateCheck(index)` - Check if door is available
- `getStartDay()` - Get calendar start date
- `addDays(date, days)` - Add days to date
- `getDayNumber()` - Get current calendar day (1-24)

**Door Availability Logic:**
```
Available Date = startDate + (doorNumber - 1) days
Current >= Available Date → Door is unlocked
```

### FileUtils
**Methods:**
- `ensureDirectoryExists()` - Create directory recursively
- `fileExists()` - Check file presence
- `getFileType()` - Determine file type from extension
- `readTextFile()` - Read file contents
- `deleteFileWithRetry()` - Safe file deletion with retries
- `cleanupTempFiles()` - Remove temporary files

**File Type Detection:**
- Text: .txt, .md
- Image: .jpg, .jpeg, .png, .webp
- Video: .mp4, .webm, .mov
- Audio: .mp3, .wav, .ogg
- GIF: .gif

### Logger
**Methods:**
- `info()`, `error()`, `warn()`, `debug()` - Logging with timestamps
- Development-only debug logging

---

## 11. Authentication & Authorization

### Authentication Mechanism
1. **Login Flow:**
   - POST `/api/admin/login` with username + password
   - AuthService validates against hashed password
   - Generate JWT token + CSRF token
   - Set httpOnly cookies: `admin_token`, `admin_csrf`

2. **JWT Token:**
   - Payload: `{ username }`
   - Expiry: 24 hours
   - Signed with `JWT_SECRET` env var

3. **CSRF Protection:**
   - Token generated on login
   - Required in `X-CSRF-Token` header for mutating operations
   - Timing-safe comparison against cookie value

4. **Rate Limiting:**
   - 5 login attempts per 15 minutes
   - IP-based blocking (via x-forwarded-for header)

### Authorization
- **Middleware**: `withAuth()` wrapper for protected routes
- **Admin-only routes**: All `/api/admin/*` endpoints
- **Credentials validation**: Each route verifies authentication

### Security Features
- **Bcrypt hashing** (10 rounds dev, 12 rounds production)
- **Timing-safe comparison** for CSRF tokens
- **httpOnly cookies** for tokens
- **Secure flag** in production
- **SameSite: strict** CSRF prevention
- **Environment variable protection** for credentials

---

## 12. Media Handling

### Media Directory Structure
```
public/
├── media/           # Uploaded content files
├── thumbnails/      # Generated preview images
└── assets/          # Static assets (puzzle.jpg, etc.)

data/
├── messages/        # Text descriptions (doorNumber.txt)
└── polls/           # Poll definitions
    ├── pollData.json      # Poll questions & options
    └── pollVotes.json     # Vote counts & voter tracking
```

### Thumbnail Generation
- **Light & Dark variants** for all content types
- **500x500px** base size (configurable)
- **85% JPEG quality** (configurable)
- **Caching strategy**: Reuse if image unchanged
- **Format support**: Sharp (images), FFmpeg (videos), Canvas (text/polls/audio)

### File Upload Process
1. Client uploads to `/api/admin/upload/:doorNumber`
2. File saved to `public/media/`
3. Filename indexed in `data/medium.json`
4. Thumbnail generated asynchronously
5. Optional message saved to `data/messages/:doorNumber.txt`

### Supported Media Types
- **Images**: JPEG, PNG, WebP
- **Videos**: MP4, WebM, MOV (requires FFmpeg)
- **Audio**: MP3, WAV, OGG
- **GIFs**: Animated GIF (first frame as thumbnail)
- **Text**: Markdown with GitHub Flavored Markdown support

---

## 13. State Management

### Frontend State (React)
```typescript
// Main calendar (page.tsx)
const [doors, setDoors] = useState<DoorContent[]>([])  // All door data
const [doorStates, setDoorStates] = useState<Record<number, { win?: boolean }>>({})  // Puzzle solved status
const [doorOrder, setDoorOrder] = useState<number[]>([])  // Shuffled order
const [openedDoors, setOpenedDoors] = useState<number[]>([])  // Opened doors
const [selectedDoor, setSelectedDoor] = useState<DoorContent | null>(null)  // Current modal
const [showSnow, setShowSnow] = useState(true)  // Snow preference
const [title, setTitle] = useState('...')  // Calendar title
```

### Client-Side Persistence (localStorage)
```javascript
// Key-value pairs stored in localStorage
'doorOrder'                  // Shuffled door array [JSON]
'openedDoors'                // Opened door numbers [JSON]
'doorStates'                 // Puzzle states [JSON]
'showSnow'                   // Snow preference [boolean]
'adventCalendarUserId'       // Unique user ID for polls
```

### Backend State (File System)
```
data/
├── medium.json              # Media file index
├── settings.json            # Calendar settings
├── admin-credentials.json   # Admin password hash
├── messages/:doorNumber.txt # Door descriptions
└── polls/
    ├── pollData.json        # Poll definitions
    └── pollVotes.json       # Vote counts
```

### Cache State (Runtime)
```typescript
// In-memory cache in API route
let doorDataCache = {
  data: Record<string, DoorContent>,
  timestamp: number
}
const CACHE_TTL = 10000  // 10 seconds
```

---

## 14. Styling Approach

### CSS Framework
- **Tailwind CSS** for utility-first styling
- **CSS-in-JS via className** (no style prop needed)

### Color Palette
```css
/* Theme variables (globals.css) */
--background: 0 0% 100%          /* White in light, 4% dark gray in dark */
--foreground: 0 0% 4%             /* Dark text */
--christmas-red: 0 72% 51%        /* #C41E3A */
--christmas-green: 142 76% 36%    /* #1B8449 */
--christmas-gold: 43 74% 66%      /* #D6AE38 */
```

### Theme Support
- **Dark mode**: CSS class-based (`class` attribute on html)
- **next-themes integration**: `useTheme()` hook
- **Theme detection**: System preference + manual override
- **Persistent theme**: Stored in localStorage

### Responsive Design
```typescript
// Mobile-first approach
className="grid-cols-4 sm:grid-cols-6"  // 4 cols mobile, 6 cols tablet+
className="gap-1.5 sm:gap-2 md:gap-3"   // Responsive gaps
className="text-sm sm:text-base"        // Responsive text sizes
```

### Shadow & Effects
- **Custom shadows** defined in globals.css
- **Animations**: pulse-slow, shimmer, float, glow
- **Backdrop blur** for glass morphism effect
- **Gradient animation** for loading states

### Component Styling Patterns
- **shadcn/ui** uses CVA (class-variance-authority)
- **Custom Tailwind classes** for specific components
- **Inline responsive classes** in JSX
- **CSS Grid** for door layout
- **Flexbox** for header/footer

### Dark Mode Support
```typescript
// Automatic in components via Tailwind
className="dark:text-white dark:bg-black"
// Theme-specific logic
const isDarkMode = resolvedTheme === 'dark'
```

---

## 15. Additional Implementation Details

### Fisher-Yates Shuffle Algorithm
```typescript
// Used to randomize door order
const numbers = Array.from({ length: 24 }, (_, i) => i + 1);
for (let i = numbers.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
}
// Persisted in localStorage for consistency
```

### Puzzle Image Indexing
```typescript
// Puzzle images stored separately with offset
puzzleImageIndex = doorNumber + 1000
// Door 1's image: medium.json[1001]
// Allows separation from door content
```

### Poll Voting System
```typescript
// Anonymous voting - no user authentication required
userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
// Stored in localStorage for per-user one-vote limit
// Vote count: poll_votes.json[doorNumber].votes[option]
```

### Door Availability Calculation
```typescript
Today >= (StartDate + (DoorNumber - 1) days) → Unlocked
// Timezone handling: setHours(0, 0, 0, 0) for UTC midnight
```

### Error Handling Strategy
- **Try-catch blocks** throughout services
- **Logger utility** for all errors
- **Fallback values** (null, empty arrays, defaults)
- **User-friendly error messages** in UI

### Performance Optimizations
- **Cache headers** (s-maxage=60)
- **Thumbnail generation** on-demand with caching
- **Image optimization** with Sharp
- **In-memory door data cache** (10s TTL)
- **Lazy component loading** with dynamic imports (if used)

---

## 16. Development Workflow

### Setup
```bash
npm install
```

### Environment Setup
```bash
# Create .env.local
JWT_SECRET="your-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
# ... other env vars
```

### Development Server
```bash
npm run dev
# Runs on http://localhost:3000
# Admin at http://localhost:3000/admin
```

### Building
```bash
npm run build
npm start
```

### Directory Structure on Init
Auto-created on first request:
```
data/
├── messages/
├── polls/
├── medium.json
├── settings.json
└── admin-credentials.json

public/
├── media/
├── thumbnails/
└── assets/
```

---

## 17. Key Decisions & Rationale

1. **File-based storage** instead of database - Simple deployment, no external dependencies
2. **JWT for admin auth** - Stateless, scalable
3. **localStorage for client state** - No server-side session management
4. **Thumbnail generation** in API response - Ensures consistency with content
5. **Fisher-Yates shuffle** in localStorage - Persistent randomization
6. **Dark/Light theme variants** for thumbnails - Better visual consistency
7. **Next.js App Router** - Modern React patterns, server components
8. **Tailwind + shadcn/ui** - Rapid component development
9. **TypeScript throughout** - Type safety, better IDE support
10. **Service layer abstraction** - Separation of concerns, testability

---

## 18. Testing Considerations

### Manual Testing Areas
- Door availability by date
- Puzzle submission
- Poll voting (single vote per user)
- Theme switching
- Media playback (audio/video)
- Admin login/logout
- Content upload & thumbnail generation
- Dark mode rendering

### Unit Testing Opportunities
- `TimingService.dateCheck()` with various dates
- `FileUtils.getFileType()` with different extensions
- `AuthService` password validation
- `PollService` vote logic
- Shuffle algorithm consistency

### Integration Testing
- Full flow: Upload → Thumbnail → Display
- Authentication → Protected routes
- Content rendering across types

---

**Last Updated**: Analysis based on codebase snapshot (57 TypeScript/TSX files)
**Version**: Next.js 14.2.33 with React 18.3.1
