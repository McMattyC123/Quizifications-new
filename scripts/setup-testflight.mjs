import { readFile } from 'fs/promises';
import jwt from 'jsonwebtoken';

const ISSUER_ID = '7fa91120-0d95-4b24-b858-49f3b09bb483';
const KEY_ID = 'QKGQ9G8BRJ';
const PRIVATE_KEY_PATH = './app/AuthKey_QKGQ9G8BRJ.p8';
const APP_ID = '6758812628';
const BASE = 'https://api.appstoreconnect.apple.com/v1';

let token;

async function generateToken() {
  const privateKey = await readFile(PRIVATE_KEY_PATH, 'utf8');
  token = jwt.sign(
    {
      iss: ISSUER_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 20 * 60,
      aud: 'appstoreconnect-v1',
    },
    privateKey,
    { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
  );
}

async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE}/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (options.method === 'DELETE' && (res.ok || res.status === 204)) return { ok: true };
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return { ok: true };
}

async function main() {
  await generateToken();
  console.log('Connected to App Store Connect API.\n');

  const { data: app } = await apiFetch(`apps/${APP_ID}`);
  console.log(`App: ${app.attributes.name}\n`);

  console.log('=== 1. Setting Beta App Localizations ===');
  const { data: betaLocalizations } = await apiFetch(
    `apps/${APP_ID}/betaAppLocalizations`
  );

  let enUSBeta = betaLocalizations?.find(l => l.attributes.locale === 'en-US');

  const betaDescription = `Welcome to Quizifications beta testing!

Turn your notes into AI-powered quiz questions. Add notes by typing, pasting, or scanning handwritten pages — then let AI generate multiple-choice questions to test your knowledge.

Features to test:
• Add notes (type/paste or scan with camera)
• AI quiz question generation
• Take quizzes with multiple choice answers
• Push notification quizzes
• Progress tracking with streaks and accuracy
• Spaced repetition learning

Please report any bugs or feedback via the TestFlight app. Thank you for helping us improve Quizifications!`;

  const feedbackEmail = 'matt@quizifications.com';
  const marketingUrl = 'https://quizifications.com';
  const privacyPolicyUrl = 'https://quizifications.com/privacy.html';

  if (enUSBeta) {
    console.log('Updating existing en-US beta localization...');
    await apiFetch(`betaAppLocalizations/${enUSBeta.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'betaAppLocalizations',
          id: enUSBeta.id,
          attributes: {
            description: betaDescription,
            feedbackEmail,
            marketingUrl,
            privacyPolicyUrl,
          },
        },
      }),
    });
    console.log('Updated beta app localization.\n');
  } else {
    console.log('Creating en-US beta localization...');
    await apiFetch('betaAppLocalizations', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'betaAppLocalizations',
          attributes: {
            locale: 'en-US',
            description: betaDescription,
            feedbackEmail,
            marketingUrl,
            privacyPolicyUrl,
          },
          relationships: {
            app: {
              data: { type: 'apps', id: APP_ID },
            },
          },
        },
      }),
    });
    console.log('Created beta app localization.\n');
  }

  console.log('=== 2. Setting Beta App Review Details ===');
  const { data: reviewDetail } = await apiFetch(
    `apps/${APP_ID}/betaAppReviewDetail`
  );

  const reviewAttrs = {
    contactFirstName: 'Matt',
    contactLastName: 'Cliett',
    contactEmail: 'matt@quizifications.com',
    contactPhone: '+18654057822',
    demoAccountName: '',
    demoAccountPassword: '',
    demoAccountRequired: false,
    notes: 'To test: Open the app, sign up with any email/password, add a note by typing or pasting text, tap Generate Questions, then go to Quiz tab to take a quiz. No special credentials needed.',
  };

  if (reviewDetail) {
    console.log('Updating beta app review details...');
    await apiFetch(`betaAppReviewDetails/${reviewDetail.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'betaAppReviewDetails',
          id: reviewDetail.id,
          attributes: reviewAttrs,
        },
      }),
    });
    console.log('Updated beta review details.\n');
  } else {
    console.log('Creating beta app review details...');
    await apiFetch('betaAppReviewDetails', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'betaAppReviewDetails',
          attributes: reviewAttrs,
          relationships: {
            app: {
              data: { type: 'apps', id: APP_ID },
            },
          },
        },
      }),
    });
    console.log('Created beta review details.\n');
  }

  console.log('=== 3. Setting Beta License Agreement ===');
  try {
    const { data: licenseAgreements } = await apiFetch(
      `apps/${APP_ID}/betaLicenseAgreement`
    );

    if (licenseAgreements) {
      await apiFetch(`betaLicenseAgreements/${licenseAgreements.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          data: {
            type: 'betaLicenseAgreements',
            id: licenseAgreements.id,
            attributes: {
              agreementText: `QUIZIFICATIONS BETA TEST LICENSE AGREEMENT

By using this beta version of Quizifications, you agree to the following terms:

1. This is pre-release software provided for testing purposes only.
2. The app may contain bugs and is not yet ready for commercial release.
3. Your feedback helps us improve the app before public release.
4. Do not distribute or share this beta build with others.
5. We may collect anonymous usage data to improve app performance.
6. Your notes and quiz data are stored securely on our servers.
7. This beta test period may end at any time without notice.
8. By participating, you agree to our Privacy Policy at https://quizifications.com/privacy.html and Terms of Service at https://quizifications.com/terms.html.

Thank you for helping test Quizifications!`,
            },
          },
        }),
      });
      console.log('Updated beta license agreement.\n');
    }
  } catch (err) {
    console.log(`Beta license agreement: ${err.message}\n`);
  }

  console.log('=== 4. Creating Beta Test Group ===');
  const { data: existingGroups } = await apiFetch(
    `apps/${APP_ID}/betaGroups`
  );

  let externalGroup = existingGroups?.find(g => g.attributes.name === 'External Testers');

  if (!externalGroup) {
    console.log('Creating "External Testers" beta group...');
    try {
      const createRes = await apiFetch('betaGroups', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'betaGroups',
            attributes: {
              name: 'External Testers',
              isInternalGroup: false,
              publicLinkEnabled: true,
              publicLinkLimitEnabled: false,
              feedbackEnabled: true,
            },
            relationships: {
              app: {
                data: { type: 'apps', id: APP_ID },
              },
            },
          },
        }),
      });
      externalGroup = createRes.data;
      console.log(`Created beta group: ${externalGroup.attributes.name}`);
      if (externalGroup.attributes.publicLink) {
        console.log(`Public link: ${externalGroup.attributes.publicLink}`);
      }
    } catch (err) {
      console.error(`Failed to create beta group: ${err.message}`);
    }
  } else {
    console.log(`Beta group already exists: ${externalGroup.attributes.name}`);
    console.log('Enabling public link and feedback...');
    try {
      await apiFetch(`betaGroups/${externalGroup.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          data: {
            type: 'betaGroups',
            id: externalGroup.id,
            attributes: {
              publicLinkEnabled: true,
              publicLinkLimitEnabled: false,
              feedbackEnabled: true,
            },
          },
        }),
      });
    } catch (err) {
      console.log(`Note: ${err.message}`);
    }
  }

  console.log('');

  console.log('=== 5. Checking Internal Testers Group ===');
  let internalGroup = existingGroups?.find(g => g.attributes.isInternalGroup === true);
  if (internalGroup) {
    console.log(`Internal group exists: ${internalGroup.attributes.name}`);
  } else {
    console.log('No internal test group found (created automatically by Apple for team members).');
  }

  console.log('\n========================================');
  console.log('TestFlight setup complete!');
  console.log('========================================\n');
  console.log('Next steps:');
  console.log('1. Build your app:  cd app && eas build --platform ios --profile production');
  console.log('2. Submit to App Store Connect:  cd app && eas submit --platform ios --latest');
  console.log('3. After the build is processed (~15-30 min), it will appear in TestFlight');
  console.log('4. Internal testers (your team) can test immediately');
  console.log('5. External testers need Apple\'s Beta App Review approval (~24-48 hours)');
  if (externalGroup?.attributes?.publicLink) {
    console.log(`\nPublic TestFlight link: ${externalGroup.attributes.publicLink}`);
  }
  console.log('\nTesters can be added via App Store Connect > TestFlight > External Testers');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
