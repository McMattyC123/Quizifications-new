# Quizifications

## Overview
Quizifications is a **notification-only** React Native/Expo iOS quiz app for passive knowledge retention. Users add notes once during setup, then **never open the app again**. Every 5-10 minutes, push notifications deliver quiz questions that users answer directly from the notification by tapping to expand and selecting A/B/C/D. If ignored 3 times consecutively, notifications snooze for 1 hour then auto-resume. AI generates comprehensive, knowledge-based multiple choice questions about the note topic. Uses custom Express.js backend with Replit PostgreSQL database.

## Brand Identity
- **Primary Color**: Lime green (#c8ff00)
- **Background**: Black (#0a0a0b) with elevated cards (#141416, #1a1a1e)
- **Logo**: Bold "Q" in lime green
- **Contact**: matt@quizifications.com
- **Website**: quizifications.com

## Project Structure
```
server/                        # Express.js backend API
├── index.ts                   # Main server: serves API + static landing page on port 5000
├── scheduler.ts               # Notification scheduler: sends quiz push notifications every 60s
├── routes/
│   ├── auth.ts                # Auth: register, login, delete account (email/password only)
│   ├── notes.ts               # Notes CRUD, AI question generation (knowledge-based)
│   ├── quiz.ts                # Quiz: stats, notification-answer endpoint
│   └── settings.ts            # User settings CRUD

shared/
└── schema.ts                  # Drizzle ORM schema (users, notes, note_questions, quiz_attempts, user_settings)

public/                        # Static website (served by Express)
├── index.html                 # Landing page ("Knowledge on Autopilot")
├── privacy.html               # Privacy policy (App Store compliant)
├── terms.html                 # Terms of service
├── about.html                 # About page
├── contact.html               # Contact page
└── assets/                    # Website assets (logo, icons)

app/                           # React Native/Expo mobile app
├── App.tsx                    # Main entry with navigation (4 screens: Home, Notes, AddNote, Settings)
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # JWT auth state management with AsyncStorage
│   ├── lib/
│   │   ├── api.ts             # REST API client with JWT auth
│   │   └── notifications.ts   # Push notifications: opensAppToForeground=false, silent answer submission
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Setup-only dashboard (status, stats, "You're all set!")
│   │   ├── NotesScreen.tsx    # Notes list with delete functionality
│   │   ├── AddNoteScreen.tsx  # Add notes: type/paste, camera scan, or gallery
│   │   ├── SettingsScreen.tsx # Settings, quiz interval slider, subscription, account deletion
│   │   └── AuthScreen.tsx     # Sign in/sign up (email/password only)
│   └── types/                 # TypeScript type definitions
├── assets/                    # App icons and splash screens
└── package.json
```

## Architecture
- **Backend**: Express.js on Replit serving both API (/api/*) and static landing page
- **Database**: Replit PostgreSQL with Drizzle ORM
- **Auth**: JWT-based (bcrypt passwords, email/password only)
- **API Base URL**: https://a4eb0cc8-2b22-4d44-aeab-a63bdb9b6ad1-00-31pbv5x2qat5.picard.replit.dev
- **Mobile**: React Native/Expo, communicates via REST API with JWT Bearer tokens
- **Notification Scheduler**: Server-side setInterval (60s) sends quiz notifications via Expo Push API

## Core Concept: Notification-Only Quizzing
1. User adds notes (type, paste, or scan) — this is the only time they use the app
2. AI generates comprehensive knowledge-based questions about the topic
3. Server scheduler runs every 60 seconds, sending push notifications via Expo Push API
4. Notifications include question + A/B/C/D options; user answers by tapping to expand and selecting
5. `opensAppToForeground: false` — answering does NOT open the app
6. App silently submits answer to backend via `/api/quiz/notification-answer`
7. 3-strike snooze: ignore 3 consecutive notifications → pause 1 hour → auto-resume
8. Spaced repetition: least-shown and least-correct questions are prioritized

## Notification Scheduler Logic (server/scheduler.ts)
- Runs every 60 seconds via setInterval
- For each user: checks notifications_enabled, push_token, quiet hours, snooze status, elapsed time
- Before sending: checks if last notification was answered; if not, increments consecutive_ignores
- If consecutive_ignores >= 3: snooze for 1 hour, reset counter
- Question selection: ORDER BY times_shown ASC, accuracy ASC, RANDOM()
- Sends via Expo Push API with categoryId "quiz" for A/B/C/D action buttons

## API Endpoints
### Auth (/api/auth)
- POST /register - Email/password registration
- POST /login - Email/password login
- DELETE /account - Delete user account

### Notes (/api/notes)
- GET / - List user's notes
- POST / - Create note
- DELETE /:id - Delete note
- GET /:id/questions - Get questions for note
- POST /:id/generate-questions - Generate AI quiz questions (knowledge-based)

### Quiz (/api/quiz)
- GET /next - Get next quiz question (spaced repetition)
- POST /attempt - Submit quiz answer
- POST /notification-answer - Submit answer from push notification (validates question ownership)
- GET /stats - Get user's quiz statistics

### Settings (/api/settings)
- GET / - Get user settings
- PUT / - Update user settings (includes quiz_interval_minutes)
- PUT /push-token - Update push notification token

## Database Schema Key Columns (user_settings)
- quiz_interval_minutes (integer, default 10) — minutes between notifications
- last_notification_at (timestamp) — when last notification was sent
- last_notification_question_id (integer) — question in last notification
- last_notification_answered (boolean, default true) — whether last notification was answered
- consecutive_ignores (integer, default 0) — how many notifications ignored in a row
- snoozed_until (timestamp) — when snooze period ends

## Pricing Model
- **3-Day Free Trial**: Full access to all features
- **Monthly**: $1.99/month

## App Store Compliance
- Account deletion in Settings screen
- Privacy policy and Terms of Service accessible in app and on web
- Restore Purchases button for subscription restoration
- Subscription cancellation instructions for iOS
- Contact support email accessible

## Running the Backend (serves everything)
```bash
npm run dev
```
This starts the Express.js server on port 5000, serving both the API, landing page, and notification scheduler.

## Running the Mobile App
```bash
cd app && npx expo start
```

## Tech Stack
- **Mobile**: React Native, Expo SDK 54, TypeScript
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: Replit PostgreSQL (Neon-backed)
- **AI**: Claude API for quiz generation (knowledge-based) and OCR
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Notifications**: Expo Notifications with interactive categories, Expo Push API

## Environment Variables (Server-Side Only)
- DATABASE_URL - Replit PostgreSQL connection string (auto-provided)
- CLAUDE_API_KEY - Claude API key for AI quiz generation and OCR (server-side only)
- JWT_SECRET - Auto-generated on server startup if not set

## EAS Build & Submit (No Mac Required)
See `app/BUILD_INSTRUCTIONS.md` for complete step-by-step guide.

Quick commands:
```bash
npm install -g eas-cli
eas login
cd app && eas build --platform ios --profile production
eas submit --platform ios --latest
```

## TestFlight
- **Public TestFlight Link**: https://testflight.apple.com/join/ZjD4WKc4
- **External Testers Group**: "External Testers" (public link enabled, feedback enabled)
- **Internal Testers Group**: "group 1" (auto-created by Apple)
- **Beta Description**: Set with feature list and testing instructions
- **Beta Review Contact**: Matt Cliett, matt@quizifications.com, +18654057822
- **Beta License Agreement**: Configured
- **Auto-submit**: Enabled in eas.json — builds auto-submit to App Store Connect after EAS Build completes
- **Build & Submit**: `cd app && eas build --platform ios --profile production` (auto-submits)

## User Preferences
- Testing on Android Pixel 10 (user only has Android)
- No Mac available - must use EAS Build for cloud compilation
- Prefers Replit's built-in database over external services

## Recent Changes
- 2026-02-06: MAJOR: Converted to notification-only quiz app (no in-app quizzing)
- 2026-02-06: Created server/scheduler.ts — sends quiz push notifications every 60s via Expo Push API
- 2026-02-06: Added 3-strike snooze logic (ignore 3 → pause 1 hour → auto-resume)
- 2026-02-06: Added POST /notification-answer endpoint with user ownership validation
- 2026-02-06: Updated AI prompt to generate knowledge-based questions about topics, not just parrot notes
- 2026-02-06: App notifications: opensAppToForeground=false, silent answer submission
- 2026-02-06: HomeScreen redesigned as setup-only dashboard ("You're all set!")
- 2026-02-06: Removed QuizScreen from app (all quizzing via notifications)
- 2026-02-06: Added quiz interval slider (5-10 min) in Settings
- 2026-02-06: Landing page rewritten: "Knowledge on Autopilot" messaging
- 2026-02-06: App Store metadata rewritten for notification-only concept
- 2026-02-06: Set up TestFlight: beta description, review info, External Testers group
- 2026-02-06: Migrated from Supabase to Replit PostgreSQL + Express.js backend
- 2026-02-06: Security hardening: moved OCR to server-side, removed client-exposed API keys
- 2026-02-04: Added iOS camera and photo library permissions to app.json
- 2026-02-04: Updated pricing to $1.99/month (removed yearly option)
