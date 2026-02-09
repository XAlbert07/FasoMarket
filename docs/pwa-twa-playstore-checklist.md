# PWA + TWA (Play Store) Checklist - FasoMarket

## 1) PWA readiness (done in this repo)
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-512-maskable.png`
- `index.html` with manifest + theme color
- `src/main.tsx` service worker registration in production

## 2) Digital Asset Links (required for TWA)
Generate `.well-known/assetlinks.json`:

```bash
TWA_PACKAGE_NAME=com.fasomarket.app \
TWA_SHA256_CERT_FINGERPRINTS="AA:...:99,BB:...:88" \
npm run assetlinks:generate
```

Output file:
- `public/.well-known/assetlinks.json`

Deploy and verify URL:
- `https://<YOUR_DOMAIN>/.well-known/assetlinks.json`

## 3) TWA app manifest template
Use:
- `twa-manifest.template.json`

Copy and customize to `twa-manifest.json` before building Android package.

Required fields to customize:
- `packageId`
- `host`
- `iconUrl`
- `maskableIconUrl`
- `fullScopeUrl`
- `appVersionName`, `appVersionCode`

## 4) Android signing data you need
- Release keystore (`.jks`)
- SHA-256 fingerprint of signing key

Command example:

```bash
keytool -list -v -keystore <release-keystore.jks> -alias <alias>
```

## 5) Bubblewrap/TWA packaging flow (local machine with internet)
1. Install Bubblewrap (`@bubblewrap/cli`)
2. Initialize from your production URL
3. Apply your `twa-manifest.json`
4. Build signed AAB/APK
5. Test internal track in Play Console

## 6) Play Console checklist
- Privacy Policy URL
- Data safety form
- App access info (if login required)
- Content rating
- Store listing assets
  - icon 512x512
  - feature graphic 1024x500
  - screenshots phone

## 7) Functional QA before submit
- Login/register
- Search and listing details
- Publish listing flow
- Favorites/messages
- Offline fallback page
- Update behavior after deploy
