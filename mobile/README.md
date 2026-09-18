# Bookeep mobile

Expo app for Android and iOS. Same GitHub repo as the website; Hostinger still builds the web app from the repo root.

## Run

1. Install [Expo Go](https://expo.dev/go) on the phone.
2. From the repo root:

```bash
npm run dev:mobile
```

or `cd mobile` then `npm start`.

3. Scan the QR code (same Wi‑Fi as the computer).

If Expo Go says **There was a problem running the requested project**, stop Metro and start with:

```bash
cd mobile
npx expo start --offline --go
```

SDK 57 needs this when you are not logged in to an Expo account. Phone and PC must stay on the same Wi‑Fi.

| Command | What it does |
| --- | --- |
| `npm run android` | Open on an Android emulator (Android Studio) |
| `npm run ios` | Open in iOS Simulator (macOS only) |

The site is unchanged: `npm run dev` and `npm run build` at the repo root.

## Catalog (step 2)

Copy `mobile/.env.example` to `mobile/.env` and put the **same** public Supabase URL and anon/publishable key as the website (never the service role).

Restart Expo after changing `.env`.

## Auth (step 3)

In **Supabase → Authentication → URL Configuration** add these Redirect URLs. Do **not** delete the existing website ones.

```
bookeep://**
exp://**
```

Google Cloud callback stays:

```
https://tgnkudihalepjobqmukr.supabase.co/auth/v1/callback
```

Email sign-in works without extra Google setup. Google in Expo Go needs the extra Redirect URLs above, then a Metro reload.

If Google sends you to **bookeep.cloud** instead of back to the app, the redirect was rejected and Supabase fell back to Site URL. Supabase Auth refuses any redirect whose host is a bare IP address, and Expo Go normally serves `exp://192.168.x.x:8081/...`, so the allow list never gets a chance to match.

Start Metro with a hostname instead of the LAN IP:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="desktop-en1ghf4.local"
npx expo start --go
```

The redirect then becomes `exp://desktop-en1ghf4.local:8081/--/auth/callback`, which matches `exp://**`. `npx expo start --tunnel` works too when ngrok is reachable. Standalone builds use `bookeep://auth/callback` and need none of this.

In Expo Go the current redirect is printed under the Google button and in the Metro log.

On the sign-in screen, **Forgot password?** sends a reset email. Open the link on the same phone so the app can ask for a new password. The redirect is the same `bookeep://auth/callback` / `exp://…/--/auth/callback` as Google. Signed-in accounts can also set a new password under More → Account.

Likes and the reading list sync with the website.

## Reader (step 5)

Tap **Read** on a book. Pages turn with Previous / Next. If you are signed in, the current page is saved to the same `reading_progress` table as the website, so History and continue-from-page work across web and the app.

Guests can still open a PDF; progress is only stored in the cloud after sign-in.

Zoom with a pinch on the page; double-tap zooms in or resets. The screen stays on while you read. The sun control dims the page; dark paper stays next to it. Both are kept on the device (paper uses the same `bookeep_pdf_paper` key as the website). Tap the page counter at the bottom to jump to a page. Swipe left/right at zoom 1 to turn pages. Opening a book also saves the PDF on the device; the reader uses a bundled pdf.js engine, so a saved book opens without internet.

## Language and theme (step 6)

Interface language is FI / EN / UA / RU — the same copy keys as the website. Book language stays English or Finnish. Theme is light or dark and is remembered on the device.

Change both on the catalog screen (language chips + sun/moon) or on Account.

## Parity with the mobile site

The app mirrors the website, rearranged for a phone:

Tabs: **Home · Books · My books · More**. Sign-in lives in More, the way the site keeps it in the header menu.

| Website | App |
| --- | --- |
| `/` hero, three mood cards, featured books | Home tab: same copy, four featured books, “All books” |
| `/books` with language and level filters | Books tab: same filter chips, two-column grid, pull to refresh |
| Book card with cover, level badge, heart and bookmark | Same card; heart and bookmark sit on the cover |
| `/books/:slug` details page | Book screen: cover, level, description, Read / Continue, offline save, Share, Like, Plan to read |
| `/library` shelves | My books: Liked, Plan to read, Reading history |
| `/read/:slug` with zoom, dark paper, page jump | Reader (pdf.js in a WebView): same controls, zoomed pages scroll |
| `/about`, `/contact`, `/privacy` | More tab: the same three pages, contact form included |
| Header sign-in | More tab: Account row |
| Header language switcher and theme toggle | Chips on Home, Books, More and Account |

Wording comes from the same locale files, so both stay in sync.

Share sends `https://bookeep.cloud/books/{slug}`. Opening `bookeep://books/{slug}` (or `exp://…/--/books/{slug}` in Expo Go) opens that book in the app. The website book page also has **Open in app**. Standalone iOS builds will use Universal Links on `bookeep.cloud` (`associatedDomains`); that part needs an Apple Developer account.

## Name, icon, splash, EAS (step 7)

The app is named **Bookeep**, uses scheme `bookeep://`, and has the same book mark as the website.

**Expo Go (now):** from the repo root run `npm run dev:mobile`, open Expo Go, scan the QR on the same Wi‑Fi. The home-screen icon stays Expo Go — that is expected.

**Standalone Android (free, no Play Store):** project `@17kengan06/bookeep` on Expo. From `mobile/`:

```bash
npx eas-cli login
npx eas-cli build --profile preview --platform android --non-interactive --no-wait
```

That queues an APK. Install from the Expo build page (unknown sources on). Google sign-in in the APK uses `bookeep://auth/callback` — add that URL in Supabase Auth redirects, and never overwrite the website callback. iOS device builds still need a paid Apple Developer account.

Do not run `eas submit` until you explicitly want store listing.

