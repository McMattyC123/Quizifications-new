# Quizifications - iOS App Store Build & Submit Instructions

## Prerequisites

1. **Apple Developer Account** ($99/year) - https://developer.apple.com
2. **Expo Account** (free) - https://expo.dev
3. **EAS CLI** installed globally

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

## Step 3: Configure Environment Variables

The app connects to the Replit backend API. No client-side secrets are needed in the EAS build — all sensitive keys (CLAUDE_API_KEY, JWT_SECRET) stay on the server.

The API base URL is already configured in `app/src/lib/api.ts`.

## Step 4: Set Up Apple Credentials

EAS Build will automatically manage your iOS certificates and provisioning profiles. When prompted:

1. Select "Let EAS handle it" for credentials
2. Log in with your Apple Developer account
3. EAS will create and manage certificates for you

## Step 5: Create Production Build

```bash
cd app
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud (no Mac required!)
- Generate an `.ipa` file ready for App Store
- Take approximately 15-30 minutes

## Step 6: Submit to App Store

### Option A: Automatic Submit via EAS

First, update `eas.json` with your Apple credentials:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@email.com",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "YOUR_APPLE_TEAM_ID"
    }
  }
}
```

To find these values:
- **appleId**: Your Apple Developer account email
- **ascAppId**: App Store Connect → Your App → App Information → Apple ID
- **appleTeamId**: Apple Developer → Membership → Team ID

Then submit:

```bash
eas submit --platform ios --latest
```

### Option B: Manual Submit via Transporter

1. Download the `.ipa` from your EAS build
2. Download [Transporter](https://apps.apple.com/app/transporter/id1450874784) from the Mac App Store (or use a Mac via virtual service)
3. Upload the `.ipa` via Transporter
4. Go to App Store Connect to configure your app listing

## Step 7: App Store Connect Setup

Before your app can go live, configure in App Store Connect:

### Required Information
- App name: "Quizifications"
- Bundle ID: com.quizificationsapp.quizifications
- Primary language: English
- Category: Education
- Secondary category: Productivity

### Screenshots (Required)
Upload the screenshots from `public/app-store-screenshots/`:
- 6.7" iPhone (iPhone 14 Pro Max, 15 Pro Max)
- 6.5" iPhone (iPhone 11 Pro Max, 12 Pro Max, 13 Pro Max)
- 5.5" iPhone (iPhone 8 Plus)

### App Description
```
Turn your study notes into interactive quizzes with AI!

Quizifications helps you learn faster by converting your notes into smart quiz questions. Simply type, paste, or scan your handwritten notes - our AI creates multiple-choice questions automatically.

KEY FEATURES:
📝 Add notes by typing, pasting, or scanning photos
🤖 AI generates quiz questions from your content
📲 Get quizzed via push notifications - no app opening needed!
🔥 Track your streak and accuracy stats
📊 Smart spaced repetition for effective learning

PRICING:
• 3-day free trial with full access
• $1.99/month for unlimited notes and quizzes

Perfect for students preparing for exams, professionals learning new skills, or anyone who wants to memorize information more effectively.
```

### Keywords
```
study, quiz, flashcards, notes, learning, exam, test, education, ai, memory, spaced repetition
```

### Privacy Policy URL
```
https://quizifications.com/privacy.html
```

### Support URL
```
https://quizifications.com/contact.html
```

### In-App Purchases

Configure your subscription in App Store Connect:

1. Go to Features → In-App Purchases
2. Create new "Auto-Renewable Subscription"
3. Product ID: `quizifications_monthly_199`
4. Reference Name: "Quizifications Monthly"
5. Price: $1.99 USD
6. Subscription Group: "Quizifications Premium"

### App Review Notes
```
Test Account Credentials:
Email: [create a test account]
Password: [test password]

The app allows users to:
1. Sign up for an account
2. Add study notes (type/paste or scan with camera)
3. AI generates quiz questions automatically
4. Receive push notification quizzes
5. Track learning progress and streaks

Note: Push notifications require a real device to test.
The 3-day trial begins when a user subscribes.
```

## Troubleshooting

### Build Fails
- Check that all environment secrets are set in Expo dashboard
- Verify your Apple Developer account is active
- Run `eas build --platform ios --profile preview` first to test

### Submit Fails
- Ensure your App Store Connect app is created first
- Verify Apple credentials in `eas.json` are correct
- Check that provisioning profiles match

### App Rejected
Common reasons:
1. Missing privacy policy - ensure URL is accessible
2. Subscription issues - ensure pricing is clear
3. Missing demo account - provide test credentials
4. Crash on launch - test with TestFlight first

## Testing Before Submit

```bash
# Build for internal testing
eas build --platform ios --profile preview

# Install on your device via TestFlight
# Or use Expo Go for development testing:
cd app
npx expo start
```

## Useful Commands

```bash
# Check build status
eas build:list

# View credentials
eas credentials

# Update over-the-air (after initial release)
eas update --branch production
```

## Contact

For issues with the app:
- Email: matt@quizifications.com
- Website: https://quizifications.com
