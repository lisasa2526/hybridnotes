# Confidence Gate — HybridNotes (BuildHybridAI)

Verified: **2026-11-20** (Beijing time), against the real Firebase project.
Harness: `scripts/verify-cloud.mjs` (Node, firebase JS SDK v12 — the same
SDK and the same initialization as `src/firebase-ai.js`: `GoogleAIBackend`,
same system instruction, prompt built by `src/prompts.js`).

## ⚠️ Config discrepancy found first (read this)

The task brief named projectId **hybridnotes-e1d89**, and the `.env` present
at the start of this session indeed contained an `hybridnotes-e1d89` config.
Mid-session (≈12:42 CST) `.env` was replaced by a different, internally
consistent config — project **hybridnotes-33869** (authDomain / storage
bucket / messagingSenderId / appId all match each other, and this is also
the projectId recorded in long-term memory from the browser setup).
`dist/` was rebuilt against it at the same moment. All verification below
ran against **hybridnotes-33869**, md5-stable throughout. If e1d89 was a
real second project, it is not the one wired up now.

## 1. Build + config wiring — ✅ PASS

- `npm run build` succeeds (Vite, bundle ≈ 82.5 KB JS).
- Built bundle contains `hybridnotes-33869` (×3) and an apiKey-format
  string — the real config is wired in, not placeholders (`.env` itself is
  gitignored and was never committed).

## 2. Real cloud call (Firebase AI Logic, GoogleAIBackend) — ✅ PASS, then 🔶 blocked by App Check

Two real findings, in order:

**(a) The app's pinned model was dead.** With the original
`gemini-2.5-flash`, the API returned a real 404:
*"This model models/gemini-2.5-flash is no longer available to new users.
Please update your code to use models/gemini-3.8-flash…"*
→ Fixed: `CLOUD_MODEL` in `src/firebase-ai.js` is now `gemini-3.8-flash`
(the replacement the API itself names), bundle rebuilt and re-grepped.

**(b) With `gemini-3.8-flash`, real calls succeeded (≈12:44 CST):**

- Cloud model — SUCCESS. `inferenceSource: "in_cloud"`,
  usageMetadata: prompt 136 tokens / candidates 12 / total 809.
  Response text: *"The team agreed to ship the HybridNotes demo this week."*
- Hybrid model (`PREFER_ON_DEVICE`) — SUCCESS.
  `inferenceSource: "in_cloud"` (honest: Node has no Gemini Nano, so the
  SDK served cloud and said so), usageMetadata total 546 tokens.
  Response text: *"The team agreed to ship the HybridNotes demo this week,
  with testing the fallback chain on older Chromebooks identified as a
  critical prerequisite before the release."*

This is a genuine end-to-end pass: real project, real Gemini response,
SDK-reported cloud source — not the local fallback.

**(c) Minutes later (≈12:47 CST) the same calls began failing with:**
`[401 Unauthorized] Firebase App Check token is invalid.`
Retried after a wait — consistent. Interpretation: **App Check
enforcement for the AI Logic API was switched on in the project during
this window** (the passing calls prove it was not enforced at ≈12:44).
The Node harness cannot mint an App Check token (no reCAPTCHA in Node, no
registered debug token), so Node-side verification is blocked *by App
Check*, not by the AI Logic path itself.

**Fix (console steps, user/parent):**
1. For browser use: complete App Check setup for the Web app
   (reCAPTCHA Enterprise) in Firebase console → put the site key in
   `.env` as `VITE_FIREBASE_APPCHECK_SITE_KEY` — `src/firebase-ai.js`
   already initializes App Check automatically when that key exists.
2. For Node re-verification: register an App Check **debug token** in
   the console (App Check → Apps → ⋮ → Manage debug tokens), then the
   harness can run with it.
3. (Not recommended beyond demo day: turning enforcement back off also
   unblocks, at the cost of an unprotected endpoint.)

**Status update (2026-11-20, later session):** steps 1–2 are DONE.
The site key is in `.env`, the bundle was rebuilt (`index-BSNZ6M7b.js`)
and redeployed to GitHub Pages (served JS is byte-identical to the
local build, site key present, debug token absent from the bundle).
`scripts/verify-cloud.mjs` now supports the debug token via the
`FIREBASE_APPCHECK_DEBUG_TOKEN` env var (never committed): with it,
cloud and hybrid calls both PASS with `inferenceSource: "in_cloud"` —
the Node 401 is gone; without it, the 401 baseline still reproduces.
**One new blocker found on the live Pages origin:** reCAPTCHA will
not mint a token for `lisasa2526.github.io` because that domain is
not registered on the key (only `hybridnotes-33869.web.app` /
`.firebaseapp.com` are) — browser console: `AppCheck: ReCAPTCHA
error. (appCheck/recaptcha-error)`, generateContent → 401
`UNAUTHENTICATED`. Remaining fix (console, parent/user): add
`lisasa2526.github.io` to the reCAPTCHA key's domains in Google
Cloud Console, or serve from Firebase Hosting (domains already
registered). Full evidence: `VERIFICATION.md` §5.

**Blocker resolved (2026-11-20 ~13:14–13:28 CST):** the domain was
added to the key; after a few minutes' propagation the live Pages
origin passes the full chain — App Check token minted and exchanged
(200), cloud `generateContent` 200 with `inferenceSource:
"in_cloud"`, and the real app UI (on-device API removed to force
the cloud legs) badged "🔵 Cloud · Gemini". The 13:15 UI retest
that still showed Local fallback ran ~1 minute after the console
edit — propagation lag. Headless bot-score hypothesis refuted
(token accepted from the same headless browser). One residual
risk: the free tier allows only 20 generateContent requests/day
for gemini-3.8-flash (a 429 was observed mid-run; the chain's next
call succeeded) — demo-day traffic could exhaust it and the app
would honestly fall back to local until reset. Full evidence:
`VERIFICATION.md` §5 addendum.

## 3. On-device path (ONLY_ON_DEVICE / Gemini Nano) — ⚠️ NOT testable here

This environment has no Chrome and no Gemini Nano (Node has no
`window.ai`), so the on-device leg **cannot be verified here and is not
claimed to work**. The hybrid probe above at least proves the SDK falls
back to cloud and reports `inferenceSource` truthfully when no device
model exists.

**What the user needs to do to prove it:** open the deployed app URL —
**https://lisasa2526.github.io/hybridnotes/** (live since 2026-11-20) —
(or `npm run preview` on his own machine) in desktop **Chrome** with Gemini
Nano present (Chrome 128+; check `chrome://components` → "Optimization
Guide On Device Model" is downloaded), paste a short note, click Run on
Summarize. Proof = the result badge shows **on-device** and the detail
line reads *"Gemini Nano ran locally in Chrome via Firebase AI Logic
(ONLY_ON_DEVICE). Your text never left this device."* (On-device calls
are local, so App Check does not block this leg; the cloud legs in the
browser do need the site key from §2c.)

## 4. Remaining submission checklist (from SUBMISSION.md)

| Item | Status | Owner |
| --- | --- | --- |
| Firebase project + AI Logic + web config in `.env` | ✅ done (hybridnotes-33869, Spark) | — |
| Cloud path verified live | ✅ PASS (evidence §2b); re-verified after App Check fix — Node + debug token PASS, 401 gone (see §2c status update) | agent |
| App Check site key / debug token (§2c) | ✅ done 2026-11-20 (console by user/parent; wiring + re-verification by agent) | — |
| reCAPTCHA key domain for Pages origin | ✅ done 2026-11-20 — `lisasa2526.github.io` added to the key's domains (~13:14 CST); verified live ~13:20–13:28 CST: SDK probe getToken OK + generateContent 200 `in_cloud`, real app UI (on-device API removed) badged "🔵 Cloud · Gemini" — see VERIFICATION.md §5 addendum. New caveat: free-tier quota is only 20 generateContent requests/day for gemini-3.8-flash (one 429 observed); heavy demo-day traffic could exhaust it → honest local fallback until reset | — (raising quota = owner's billing call) |
| Public GitHub repo under lisasa2526 | ✅ done — https://github.com/lisasa2526/hybridnotes | agent (gh was authenticated) |
| Open-source license in repo | ✅ MIT `LICENSE` | — |
| Hosting / testing link (deploy `dist/`) | ✅ done — **https://lisasa2526.github.io/hybridnotes/** (GitHub Pages, `gh-pages` branch, 2026-11-20; Firebase Hosting remains an alternative, not required) | agent |
| On-device badge proof (§3) | ⏳ pending | **user** (his Chrome) |
| Demo video ≤ 3 min, public YouTube, English | ⏳ pending — script ready in `DEMO-SCRIPT.md` | **user** (his YouTube account; no upload by agent) |
| Devpost form + final submit | ⏳ pending — draft text ready in `SUBMISSION.md`; suggested submit by Nov 29 PT, deadline Nov 30 14:00 PT | **user** (final click) |

## 5. Testing link — ✅ LIVE via GitHub Pages (2026-11-20)

- **URL: https://lisasa2526.github.io/hybridnotes/**
- Published from the current `dist/` build to the repo's `gh-pages`
  branch (only `index.html`, `assets/index-*.js`, `assets/index-*.css`,
  `.nojekyll` — no `.env`, no `node_modules`). The build was re-run with
  `vite build --base=./` first: the default absolute `/assets/...` paths
  would have 404'd under the `/hybridnotes/` subpath. Bundle hash is
  unchanged (`index-Y1PgPHmN.js`), so the deployed code is byte-identical
  to the verified build — same real config (`hybridnotes-33869` present
  in the served JS), same `gemini-3.8-flash` cloud model.
- Verified live: page HTTP 200 (title "HybridNotes — Private notes,
  summarized on your device"), referenced JS and CSS both HTTP 200.
- **What this does NOT prove** (unchanged from §2c/§3): Pages only
  provides the public testing link the submission needs. The
  on-device Gemini Nano leg still needs the user's own Chrome. With
  zero setup the page answers via the local fallback engine, honestly
  badged — the judge path works today. (Update 2026-11-20, later: the
  App Check site key is now in the deployed build, but reCAPTCHA
  refuses tokens for the unregistered `lisasa2526.github.io` domain,
  so Pages cloud legs still land on the local fallback until the
  domain is registered on the key — §2c status update.)
  (Update 2026-11-20 ~13:28 CST: domain registered and verified —
  Pages cloud legs now serve real cloud Gemini end-to-end; see the
  §2c "Blocker resolved" note and `VERIFICATION.md` §5 addendum.)
- Firebase Hosting under the user's project remains an alternative host;
  it is **not required** now that the Pages link is live.

## Gate verdict

**Cloud leg: PASS** (real Gemini response, `inferenceSource: "in_cloud"`,
before App Check enforcement flipped on). **On-device leg: UNVERIFIED**
(needs the user's Chrome). **Overall: conditionally passed** — App
Check is now configured and the Node path re-verifies clean with a
debug token; the GitHub Pages domain has since been registered on
the reCAPTCHA key and the public Pages link now mints App Check
tokens and serves real cloud results end-to-end (verified
2026-11-20 ~13:20–13:28 CST, `VERIFICATION.md` §5 addendum). The
only remaining caveats are the on-device proof in the user's own
Chrome and the free-tier ceiling of 20 cloud requests/day.

## 6. Badge-label fix — 2026-11-20 (later session)

**Bug (found by the final audit's live run):** when the SDK served
**cloud** on the ONLY_ON_DEVICE pass, the run-meta line correctly said
*"Firebase reported a cloud source on the on-device pass — badge
corrected to cloud"* but the badge label still read "🟢 On-device ·
Gemini Nano". Root cause: step 1 of `runAction` in
`src/hybrid-service.js` hardcoded mode `"on-device"` (the configured
model) while the meta text was derived from the response's
`inferenceSource` — the two disagreed.

**Fix:** a single helper `modeFor(inferenceSource, fallback)` now
derives the badge mode from the response's actual `inferenceSource`
in **every** model path (on-device pass, hybrid, plain cloud):
`in_cloud` → cloud, `on_device` → on-device, missing → the only
source that configuration could have served. Meta lines unchanged.
Label and meta are now computed from the same variable in the same
return, so they cannot disagree.

**Build/deploy:** rebuilt `vite build --base=./` → new bundle
`index-pQ1H7Q2e.js` (was `index-BSNZ6M7b.js`); redeployed to
`gh-pages` (commit `ba0fc0e`); live site verified serving the new
bundle (page/JS/CSS all HTTP 200, HTML references the new hash).

**Re-verification:**
- `scripts/verify-cloud.mjs` **with debug token: not runnable from
  this session** — the App Check debug token was never persisted
  (searched env, `.env`, shell history, workspace: absent; it only
  ever existed in the §5 session's ephemeral env). Token-less re-run
  reproduces the documented baseline exactly (both calls 401 "App
  Check token is invalid" — enforcement unchanged; the script does
  not import the changed file). The §2b/§5 with-token PASS evidence
  stands for the unchanged SDK path.
- Live Pages UI runs (chrome-headless-shell 158, audit method,
  sample → Summarize, new bundle): run 1 — App Check exchanges 200,
  generateContent 200s: cloud serves end-to-end on the fixed build
  (badge text not captured — harness logging truncation, noted
  honestly). Run 2 — generateContent hit the free-tier daily quota
  (429s; the 20/day budget was consumed by today's cumulative
  verification across sessions) and the app fell back to local:
  badge "🟠 Local fallback · built-in engine" **matches** the meta
  line ("No Gemini model could serve this request…") — label/meta
  consistency confirmed live on the fallback path.
- Residual: re-capturing the badge text on the specific step-1
  cloud-serve edge needs one more live run after the daily quota
  resets; structurally, label and meta can no longer diverge (same
  `inferenceSource` drives both).
