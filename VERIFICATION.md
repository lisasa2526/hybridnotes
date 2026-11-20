# Verification — HybridNotes × real Firebase project (confidence gate / 把握关)

Date: **2026-11-20** (Beijing time). Project: **hybridnotes-33869**
(Spark plan, AI Logic enabled via Gemini Developer API, web app
"HybridNotes Web"). Method: the app's own code (`src/firebase-ai.js`,
`src/hybrid-service.js`) executed in a real browser engine
(chrome-headless-shell 158.0.8127.36, driven by puppeteer-core) against
the production build (`vite preview`) and a temporary probe page that
imported the project's own `src/firebase-ai.js` (probe files deleted
after the run). A parallel Node harness verification exists in
`GATE.md` / `scripts/verify-cloud.mjs`; this file is the independent
browser-side record.

## 1. Config wiring + build — ✅ PASS

- Real web config written to `.env` (gitignored) following the repo's
  existing `VITE_FIREBASE_*` pattern: projectId `hybridnotes-33869`,
  authDomain `hybridnotes-33869.firebaseapp.com`, storageBucket
  `hybridnotes-33869.firebasestorage.app`, messagingSenderId
  `859088246292`, appId `1:859088246292:web:1cfcc8f31ad2d509057901`,
  measurementId `G-LLC63LWV7S`, apiKey present (browser-side identifier,
  not a secret; value not reproduced here).
- ⚠️ **Discrepancy found:** at the start of this run, `.env` contained a
  *different* project's config (`hybridnotes-e1d89`, sender
  `470580121309`). It was replaced with the `hybridnotes-33869` config
  given in the task brief, which is also the project recorded from the
  browser setup. If `hybridnotes-e1d89` was a real second project, it is
  not the one wired up now.
- `npm run build` ✅ (Vite, JS bundle 82.53 KB); the built bundle
  contains `hybridnotes-33869` — the real config is in the build, not
  placeholders. Built app header reads: *"Firebase AI Logic ready —
  on-device first, cloud fallback, local last resort"*.

## 2. Cloud path (Firebase AI Logic → Gemini) — ✅ PASS (real calls)

Test prompt (summarize): *"The team confirmed the pilot budget is
approved at 120,000 dollars and the launch date is October 28. Priya
must draft the backup supplier shortlist by Friday."*

Two blockers were found and resolved on the way, in order:

1. **Sandbox egress:** headless Chrome's first attempts failed with
   `net::ERR_TUNNEL_CONNECTION_FAILED` / `Failed to fetch` to
   `firebasevertexai.googleapis.com` — this VM reaches the internet only
   via an authenticated egress proxy, which Chrome could not use
   directly. Fixed for the test by chaining a local unauthenticated
   relay proxy. This is a test-environment issue, not an app issue
   (direct `curl` via the proxy reached the API fine).
2. **Retired model:** with the app's original `CLOUD_MODEL =
   "gemini-2.5-flash"`, the backend answered a real **404**:
   *"This model models/gemini-2.5-flash is no longer available to new
   users. Please update your code to use models/gemini-3.8-flash…"*
   `CLOUD_MODEL` in `src/firebase-ai.js` is now `gemini-3.8-flash` (the
   replacement the API itself names), bundle rebuilt.

Final results, through the project's own model objects:

| Call | HTTP | inferenceSource | Real response |
| --- | --- | --- | --- |
| Hybrid `PREFER_ON_DEVICE` | 200 | `"in_cloud"` | "The pilot has an approved budget of $120,000 for an October 28 launch, with Priya tasked to draft the backup supplier shortlist by Friday." |
| Cloud `gemini-3.8-flash` | 200 | `"in_cloud"` | "The pilot project has been approved with a $120,000 budget for an October 28 launch, and Priya must draft a backup supplier shortlist by Friday." |
| Direct cloud probe (same project/key) | 200 | `"in_cloud"` | "The pilot has been approved with a $120,000 budget for an October 28 launch, with Priya tasked to draft a backup supplier shortlist by Friday." |

`inferenceSource: "in_cloud"` is the SDK-reported value — the hybrid
model honestly reporting that the cloud served the request because no
device model was available. This is a genuine end-to-end pass: real
project, real Gemini output, no local-fallback involvement.

**App Check note (precise):** the app does not initialize App Check
(no `VITE_FIREBASE_APPCHECK_SITE_KEY` set), and the browser calls above
succeeded without any App Check token. Separately, the Node harness
(`GATE.md` §2c) began receiving `401 Firebase App Check token is
invalid` from ≈12:47 CST — App Check enforcement appears to block the
token-less Node path while browser calls from the app code still pass
at the time of this run. Recommendation stands: register the
reCAPTCHA Enterprise site key and set `VITE_FIREBASE_APPCHECK_SITE_KEY`
before public deployment (the code already initializes App Check when
the key exists), and register a debug token for Node re-verification.

## 3. On-device path (ONLY_ON_DEVICE / Gemini Nano) — ⚠️ UNVERIFIED in this environment

- chrome-headless-shell exposes a `LanguageModel` API, but it is
  Chromium's built-in **stub**: when the built app was run with a real
  click gesture, the "on-device" call returned the literal text
  *"On-device model is not available in Chromium, this API is just
  echoing back the input: …"* followed by the prompt. The app's badge
  showed "On-device · Gemini Nano" for this echo — **that is not a
  real Gemini Nano inference and is not counted as a pass.**
- Without a user gesture, the SDK's on-device call fails with
  *"Requires a user gesture when availability is \"downloading\" or
  \"downloadable\""* and `initializeDeviceModel()` leaves
  `deviceReady: false` — there is no downloadable real Nano model in
  this headless shell.
- **What would verify it:** desktop Chrome (128+) on a real machine
  with Gemini Nano present/downloaded (check `chrome://components` →
  "Optimization Guide On Device Model"), open the app, paste a short
  note, click Run. Proof = badge "On-device · Gemini Nano" with a real
  summary (not an echo of the prompt) and the detail line *"Gemini
  Nano ran locally in Chrome via Firebase AI Logic (ONLY_ON_DEVICE)."*

## 4. Gate verdict — **PASS-CLOUD-ONLY**

- Cloud leg: **PASS** — real Firebase AI Logic calls against the real
  project return real Gemini text with SDK-reported
  `inferenceSource: "in_cloud"`, via both the hybrid and the explicit
  cloud models, in a browser running the app's own code.
- On-device leg: **UNVERIFIED** (not failed) — this environment cannot
  provide Gemini Nano; verification requires the user's real Chrome.
- Required fix already applied: cloud model `gemini-2.5-flash` →
  `gemini-3.8-flash` (old model retired for new users).
- Remaining before submission (unchanged, see `SUBMISSION.md`):
  App Check site key for the deployed build, hosting/testing URL,
  on-device badge proof in the user's Chrome, demo video, Devpost
  form. No deployment, repo creation, or Devpost submission was
  performed in this run.

## 5. App Check follow-up — site key wired, Node re-verified, Pages domain blocked (2026-11-20, later session)

App Check was configured in the console for project
**hybridnotes-33869** (reCAPTCHA Enterprise provider + a registered
debug token). This session wired it in and re-verified end to end:

**Build + deploy — ✅**
- `VITE_FIREBASE_APPCHECK_SITE_KEY` added to `.env` (gitignored);
  rebuilt with `vite build --base=./` → new bundle
  `index-BSNZ6M7b.js` (82.61 KB). The bundle contains the site key and
  the App Check initialization code (`initializeAppCheck` present);
  the debug token is **not** in the bundle (grep-verified).
- Redeployed to the `gh-pages` branch (commit `d093774`). Live checks:
  page HTTP 200; served JS MD5 `61fa4429…` is byte-identical to the
  local `dist/` build; site key present in the served JS; CSS 200.

**Node harness with debug token — ✅ PASS, 401 gone**
- `scripts/verify-cloud.mjs` gained optional App Check support: with
  `FIREBASE_APPCHECK_DEBUG_TOKEN` in the environment (never committed,
  never in `.env`) it sets the SDK debug-token global and initializes
  App Check with a `CustomProvider` (the reCAPTCHA provider's
  `initialize()` touches the DOM and crashes in Node; in debug mode
  the SDK exchanges the debug token before calling the provider).
- Baseline re-run without the token: both calls still fail with
  `[401 Unauthorized] Firebase App Check token is invalid.`
- With the debug token: **cloud model PASS** and **hybrid
  (PREFER_ON_DEVICE) PASS**, both `inferenceSource: "in_cloud"`, real
  Gemini text (e.g. *"The team agreed to ship the HybridNotes demo
  this week, contingent on testing the fallback chain for older
  Chromebooks."*). App Check enforcement is satisfied by the debug
  token — the 401 is gone on the Node path.

**Live Pages origin in a real browser — ⚠️ cloud legs blocked by the
reCAPTCHA key's domain list (exactly the risk flagged beforehand)**
- The deployed app loads fine (`engine-status`: *"Firebase AI Logic
  ready — on-device first, cloud fallback, local last resort"*).
  Running Summarize on the sample note finished via the fallback
  chain: badge **"🟠 Local fallback · built-in engine"**, detail
  *"No Gemini model could serve this request, so the built-in local
  engine answered. Nothing was sent anywhere."*
- Why: the generateContent POST returns **401** with body
  `{"error":{"code":401,"message":"Firebase App Check token is invalid.","status":"UNAUTHENTICATED"}}`,
  and the console shows `@firebase/vertexai: Unable to obtain a valid
  App Check token: AppCheck: ReCAPTCHA error. (appCheck/recaptcha-error)`.
  An independent same-origin SDK probe (app + App Check + cloud model
  initialized in the Pages page context) fails identically.
- Diagnosis: reCAPTCHA Enterprise will not issue a valid token for
  **lisasa2526.github.io** because that domain is not in the key's
  registered domains (only `hybridnotes-33869.web.app` and
  `hybridnotes-33869.firebaseapp.com` are). This is a console-side
  domain registration issue, not an app or SDK issue — the same build
  satisfies App Check wherever the token can be minted (debug-token
  proof above).
- **The one remaining fix (console, parent/user):** add
  `lisasa2526.github.io` to the reCAPTCHA Enterprise key's domains in
  Google Cloud Console (Security → reCAPTCHA → the site key →
  settings), then re-run this browser test. Alternative: serve the
  app from Firebase Hosting, whose domains are already registered.
  Until then, the Pages deployment answers via the honest local
  fallback; the cloud legs work from registered domains / with a
  debug token.

### §5 addendum — domain fix verified live; 13:15 local-fallback retest explained (2026-11-20 ~13:20–13:28 CST)

`lisasa2526.github.io` was added to the reCAPTCHA key's domains
(~13:14 CST, console confirmed saved). A UI retest at 13:15 still
showed Local fallback, so the live Pages origin was re-diagnosed
from scratch in chrome-headless-shell 158 (same harness as §2/§5:
puppeteer-core + proxy-chain relay), capturing console + network:

- **Same-origin SDK probe (Pages origin):** App Check
  `getToken()` → **OK** (961-char token);
  `:exchangeRecaptchaEnterpriseToken` → **200** with a real JWT
  (ttl 3600s, provider `recaptcha_enterprise`);
  cloud `generateContent` → **200**, real Gemini text,
  `inferenceSource: "in_cloud"`. No `appCheck/recaptcha-error`
  anywhere in the console.
- **Real app UI with the on-device API removed** (forces the chain
  past the headless echo stub into the cloud legs): badge
  **"🔵 Cloud · Gemini"**, detail *"Served by cloud Gemini via the
  hybrid (PREFER_ON_DEVICE) model — on-device could not serve this
  request."*, real summary returned in ~11 s.
- **Repeat probe after a further ~2 min wait:** getToken OK,
  generateContent 200 again — stable, not a flake.
- **Headless bot-score hypothesis: refuted.** The token was minted
  and accepted from the very same headless browser §5 used
  (`webdriver=true`, HeadlessChrome UA). The earlier
  `recaptcha-error` was the unregistered domain, exactly as
  diagnosed; nothing about the current failure mode is
  headless-specific, and there is no evidence the site is broken
  for human judges in real browsers — the opposite: the full chain
  now passes end-to-end from the public Pages origin.
- **Why the 13:15 retest still showed Local fallback (judgment):**
  the domain edit was ~1 minute old — reCAPTCHA key changes take
  minutes to propagate to token issuance. By ~13:20 the same tests
  pass consistently. Confidence: high that propagation lag explains
  the 13:15 result.
- **New residual risk found during this diagnosis — free-tier
  daily quota:** one `generateContent` call in the UI run returned
  **429** *"Quota exceeded for metric:
  generativelanguage.googleapis.com/generate_content_free_tier_requests,
  limit: 20, model: gemini-3.8-flash … per day limit exceeded on
  Free Tier"* (the chain's next call succeeded with 200, so the run
  still finished Cloud). Only **20 cloud requests/day** on the free
  tier: heavy same-day testing — or judge traffic on demo day —
  can exhaust it, after which the app honestly falls back to local
  until the quota resets. This is a quota ceiling, not a code or
  App Check defect; raising it needs the project's billing/plan
  (owner's call), and it also means verification runs should be
  budgeted against the daily 20.
- Note on method: with the headless echo stub present, the app's
  chain stops at the on-device leg (badge "On-device", echo text —
  the §3 stub artifact) and never exercises the cloud legs; cloud
  diagnosis therefore requires removing `LanguageModel` or using
  the SDK probe, as done here.

## 6. Badge-label fix — verification (2026-11-20, later session)

- **Fix:** `src/hybrid-service.js` — badge `mode` is now derived from
  the response's `inferenceSource` via `modeFor()` in all three model
  paths; previously step 1 (ONLY_ON_DEVICE pass) hardcoded
  `"on-device"`, so a cloud-served response wore an On-device badge
  while its own meta line reported cloud. Meta lines unchanged.
- **Build/deploy:** bundle `index-BSNZ6M7b.js` → `index-pQ1H7Q2e.js`;
  `gh-pages` commit `ba0fc0e`; live https://lisasa2526.github.io/hybridnotes/
  serves the new bundle (200s; HTML references the new hash).
- **Node harness:** debug token not persisted anywhere accessible
  (env/`.env`/history/workspace searched) — with-token re-run not
  possible from this session; token-less run reproduces the §5
  baseline (401 App Check on both calls), i.e. no change in the SDK
  path's behavior. The fix does not touch the code paths
  `verify-cloud.mjs` exercises (`firebase-ai.js`/`prompts.js`).
- **Live UI (headless-shell 158, on-device API removed, sample →
  Summarize):** run 1 on the fixed build: App Check
  `:exchangeRecaptchaEnterpriseToken` 200 ×2, `generateContent`
  200 ×2 (with two 429 rate-limit responses mid-chain) — cloud
  end-to-end on the new bundle; the run's badge text was lost to a
  logging truncation in this session (recorded as a miss, not
  reconstructed). Run 2: quota exhausted (429 ×3 after one 200) →
  honest local fallback; badge "🟠 Local fallback · built-in engine"
  and meta "No Gemini model could serve this request, so the
  built-in local engine answered." agree.
- **Not re-captured:** the badge text for the exact step-1
  cloud-serve edge (needs a post-quota-reset run). By construction
  the label and meta now come from the same `inferenceSource` value,
  so the §-audit disagreement cannot recur.
