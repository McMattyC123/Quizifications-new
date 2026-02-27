import { readFile, stat } from 'fs/promises';
import { readdirSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const ISSUER_ID = '7fa91120-0d95-4b24-b858-49f3b09bb483';
const KEY_ID = 'QKGQ9G8BRJ';
const PRIVATE_KEY_PATH = './app/AuthKey_QKGQ9G8BRJ.p8';
const APP_ID = '6758812628';

const SCREENSHOT_DIR = './app-store/screenshots/6.7-inch';
const DISPLAY_TYPE = 'APP_IPHONE_67';
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
  if (options.method === 'DELETE') {
    if (res.ok || res.status === 204) return { ok: true };
    const text = await res.text();
    throw new Error(`DELETE failed (${res.status}): ${text}`);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  await generateToken();
  console.log('Connected to App Store Connect API.\n');

  const { data: app } = await apiFetch(`apps/${APP_ID}`);
  console.log(`App: ${app.attributes.name}`);

  const { data: versions } = await apiFetch(
    `apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION`
  );

  let version = versions?.[0];
  if (!version) {
    const { data: allVersions } = await apiFetch(`apps/${APP_ID}/appStoreVersions`);
    version = allVersions?.[0];
    if (!version) { console.error('No versions found.'); process.exit(1); }
  }
  console.log(`Version: ${version.attributes.versionString} (${version.attributes.appStoreState})`);

  const { data: localizations } = await apiFetch(
    `appStoreVersions/${version.id}/appStoreVersionLocalizations`
  );
  const enUS = localizations.find(l => l.attributes.locale === 'en-US');
  if (!enUS) { console.error('No en-US localization found.'); process.exit(1); }

  const { data: existingSets } = await apiFetch(
    `appStoreVersionLocalizations/${enUS.id}/appScreenshotSets`
  );
  let screenshotSet = existingSets.find(s => s.attributes.screenshotDisplayType === DISPLAY_TYPE);

  if (!screenshotSet) {
    console.log(`Creating screenshot set for ${DISPLAY_TYPE}...`);
    const createRes = await apiFetch('appScreenshotSets', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'appScreenshotSets',
          attributes: { screenshotDisplayType: DISPLAY_TYPE },
          relationships: {
            appStoreVersionLocalization: {
              data: { type: 'appStoreVersionLocalizations', id: enUS.id },
            },
          },
        },
      }),
    });
    screenshotSet = createRes.data;
  }
  console.log(`Screenshot set: ${screenshotSet.id}\n`);

  const { data: existingScreenshots } = await apiFetch(
    `appScreenshotSets/${screenshotSet.id}/appScreenshots`
  );

  if (existingScreenshots?.length > 0) {
    console.log(`Deleting ${existingScreenshots.length} existing screenshots...`);
    for (const ss of existingScreenshots) {
      try {
        await apiFetch(`appScreenshots/${ss.id}`, { method: 'DELETE' });
        console.log(`  Deleted: ${ss.attributes.fileName}`);
      } catch (err) {
        console.error(`  Failed to delete ${ss.id}: ${err.message}`);
      }
    }
    console.log('');
  }

  const files = readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Uploading ${files.length} screenshots...\n`);

  for (const file of files) {
    const filePath = path.join(SCREENSHOT_DIR, file);
    const fileSize = (await stat(filePath)).size;
    const fileData = await readFile(filePath);

    console.log(`Uploading ${file} (${(fileSize / 1024).toFixed(0)} KB)...`);

    try {
      const reserveRes = await apiFetch('appScreenshots', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'appScreenshots',
            attributes: { fileName: file, fileSize },
            relationships: {
              appScreenshotSet: {
                data: { type: 'appScreenshotSets', id: screenshotSet.id },
              },
            },
          },
        }),
      });

      const screenshot = reserveRes.data;
      const uploadOps = screenshot.attributes.uploadOperations;

      for (const op of uploadOps) {
        const chunk = fileData.slice(op.offset, op.offset + op.length);
        const headers = {};
        for (const h of op.requestHeaders) {
          headers[h.name] = h.value;
        }
        const uploadRes = await fetch(op.url, {
          method: op.method,
          headers,
          body: chunk,
        });
        if (!uploadRes.ok) {
          throw new Error(`Chunk upload failed: ${uploadRes.status}`);
        }
      }

      await apiFetch(`appScreenshots/${screenshot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          data: {
            type: 'appScreenshots',
            id: screenshot.id,
            attributes: { uploaded: true, sourceFileChecksum: screenshot.attributes.sourceFileChecksum },
          },
        }),
      });

      console.log(`  Uploaded. Waiting for processing...`);

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: check } = await apiFetch(`appScreenshots/${screenshot.id}`);
        const state = check.attributes.assetDeliveryState?.state;
        if (state === 'COMPLETE') {
          console.log(`  ${file} done!`);
          break;
        } else if (state === 'FAILED') {
          console.error(`  ${file} processing failed.`);
          break;
        }
      }
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }

  console.log('\nAll screenshots uploaded to App Store Connect!');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
