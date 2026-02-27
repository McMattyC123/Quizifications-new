import { readFile } from 'fs/promises';
import { api } from 'node-app-store-connect-api';
import path from 'path';

const ISSUER_ID = '7fa91120-0d95-4b24-b858-49f3b09bb483';
const API_KEY = 'QKGQ9G8BRJ';
const PRIVATE_KEY_PATH = path.resolve('app/AuthKey_QKGQ9G8BRJ.p8');

const APP_ID = '6758812628';

const DESCRIPTION = `Quizifications helps you actually remember what you study by sending push notification quizzes from your own notes throughout the day.

STOP FORGETTING WHAT YOU LEARN
Research shows we forget 70% of new information within 24 hours. Quizifications uses spaced repetition and active recall - proven techniques that boost retention by up to 85%.

HOW IT WORKS
\u2022 Type, paste, or scan your handwritten notes
\u2022 Our AI generates personalized quiz questions
\u2022 Get quizzed via push notifications throughout the day
\u2022 Track your progress and watch your knowledge grow

FEATURES
\u2022 AI-Generated Questions - No more making flashcards by hand
\u2022 Push Notification Quizzes - Study in 10-second bursts
\u2022 Spaced Repetition - Review at optimal intervals
\u2022 Progress Tracking - See your improvement over time
\u2022 Scan Handwritten Notes - Just snap a photo
\u2022 Study Windows - Set when you want to be quizzed

PRICING
\u2022 3-day free trial with full access
\u2022 $1.99/month for unlimited notes and quizzes

Questions? Contact us at matt@quizifications.com`;

const KEYWORDS = 'study,quiz,flashcards,notes,learning,education,spaced repetition,AI,exam,test,memory';
const PROMOTIONAL_TEXT = 'Study smarter with AI-powered quizzes from your own notes. Get quizzed via push notifications and finally remember what you learn!';
const SUPPORT_URL = 'https://quizifications.com/contact.html';
const MARKETING_URL = 'https://quizifications.com';
const SUBTITLE = 'AI Push Notification Quizzes';
const PRIVACY_POLICY_URL = 'https://quizifications.com/privacy.html';

async function main() {
  console.log('Connecting to App Store Connect API...');
  
  const privateKey = await readFile(PRIVATE_KEY_PATH, 'utf8');
  
  const { read, create, update } = await api({
    issuerId: ISSUER_ID,
    apiKey: API_KEY,
    privateKey,
  });

  console.log('Connected! Fetching app info...');

  const { data: app } = await read(`apps/${APP_ID}`);
  console.log(`App: ${app.attributes.name} (${app.id})`);

  console.log('\nFetching app store versions...');
  const { data: versions } = await read(`apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,DEVELOPER_REJECTED,REJECTED,PENDING_DEVELOPER_RELEASE&limit=5`);
  
  let version;
  if (versions && versions.length > 0) {
    version = versions[0];
    console.log(`Found version: ${version.attributes.versionString} (state: ${version.attributes.appStoreState})`);
  } else {
    console.log('No editable version found.');
    process.exit(1);
  }

  console.log('\n--- Updating Version Localization (en-US) ---');
  const { data: localizations } = await read(`appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  
  const enUs = localizations?.find(l => l.attributes.locale === 'en-US');
  
  if (enUs) {
    await update(enUs, {
      attributes: {
        description: DESCRIPTION,
        keywords: KEYWORDS,
        promotionalText: PROMOTIONAL_TEXT,
        supportUrl: SUPPORT_URL,
        marketingUrl: MARKETING_URL,
      },
    });
    console.log('  Description: SET');
    console.log(`  Keywords (${KEYWORDS.length} chars): SET`);
    console.log('  Promotional Text: SET');
    console.log('  Support URL: SET');
    console.log('  Marketing URL: SET');
  } else {
    console.log('ERROR: No en-US localization found!');
    process.exit(1);
  }

  console.log('\n--- Updating App Info (Subtitle & Privacy Policy) ---');
  try {
    const { data: appInfos } = await read(`apps/${APP_ID}/appInfos`);
    if (appInfos && appInfos.length > 0) {
      const appInfo = appInfos[0];
      const { data: appInfoLocalizations } = await read(`appInfos/${appInfo.id}/appInfoLocalizations`);
      const enUsInfo = appInfoLocalizations?.find(l => l.attributes.locale === 'en-US');
      if (enUsInfo) {
        await update(enUsInfo, {
          attributes: {
            subtitle: SUBTITLE,
            privacyPolicyUrl: PRIVACY_POLICY_URL,
          },
        });
        console.log(`  Subtitle (${SUBTITLE.length} chars): SET - "${SUBTITLE}"`);
        console.log('  Privacy Policy URL: SET');
      }
    }
  } catch (err) {
    console.log(`  Warning: ${err.message}`);
  }

  console.log('\n=== SUMMARY ===');
  console.log('All metadata has been saved to App Store Connect:');
  console.log(`  App Name: ${app.attributes.name}`);
  console.log(`  Subtitle: ${SUBTITLE}`);
  console.log(`  Keywords: ${KEYWORDS}`);
  console.log(`  Support URL: ${SUPPORT_URL}`);
  console.log(`  Marketing URL: ${MARKETING_URL}`);
  console.log(`  Privacy Policy: ${PRIVACY_POLICY_URL}`);
  console.log('  Description: (full description set)');
  console.log('  Promotional Text: (set)');
  console.log('\nYou still need to:');
  console.log('  1. Upload screenshots manually in App Store Connect');
  console.log('  2. Select your build');
  console.log('  3. Submit for review');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  if (err.response) {
    console.error('API response:', JSON.stringify(err.response, null, 2));
  }
  process.exit(1);
});
