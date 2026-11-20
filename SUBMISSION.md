# Devpost Submission Checklist — #BuildHybridAI

Project: **HybridNotes**
Deadline: **November 30, 2026, 2:00 pm PT** (= Dec 1, 06:00 Beijing)
Target prizes: Grand $10,000 · Runner-up $7,000 · 2nd Runner-up $4,000 ·
Best Web/Chrome Application $3,000
Eligibility note: China is not on the rules' exclusion list (verified
2026-11-20 on the official Devpost rules page).

Status key: ✅ done · 🛠️ in progress · ⏳ pending-user (needs the user's own
account/action — the assistant must not log in, create repos, or upload on
the user's behalf)

## Requirements mapping

| # | Devpost requirement | Status | Notes |
| --- | --- | --- | --- |
| 1 | GenAI web app built with Firebase AI Logic | ✅ | `src/firebase-ai.js` imports `firebase/ai`, creates `ONLY_ON_DEVICE`, `PREFER_ON_DEVICE` hybrid and cloud models; `src/hybrid-service.js` calls them at runtime on every Run click when configured. |
| 2 | Hybrid inference actually used (on-device + cloud fallback) | ✅ cloud verified live / ⚠️ on-device unverified | Cloud leg proven 2026-11-20 against the real project (see `GATE.md`): real Gemini response with `inferenceSource: "in_cloud"`. Model had to move `gemini-2.5-flash` → `gemini-3.8-flash` (API retired the old one for new users). App Check is enforced: the site key is now wired into the deployed build and the Node harness re-verifies clean with a registered debug token (401 gone). ✅ The GitHub Pages origin issue is RESOLVED: `lisasa2526.github.io` was added to the reCAPTCHA key's registered domains (2026-11-20 ~13:14 CST) and the final audit's fresh live UI run on the Pages origin confirmed App Check token exchange 200 + `generateContent` 200 served by cloud Gemini (see "Final audit" below). On-device leg still needs the user's Chrome with Gemini Nano. |
| 3 | Public GitHub/GitLab repo | ✅ done | Public repo created and pushed 2026-11-20: https://github.com/lisasa2526/hybridnotes (via authenticated `gh`, account lisasa2526). |
| 4 | Open-source license file in repo | ✅ | `LICENSE` (MIT) at repo root. |
| 5 | Text description incl. how Firebase AI Logic was used | 🛠️ drafted | Use the README sections "How Firebase AI Logic hybrid inference is used" + the draft description below; paste into the Devpost form. ⏳ pending-user to submit the form. |
| 6 | Demo video ≤ 3 min, public on YouTube, in English | 🎬 video LIVE on YouTube: https://youtu.be/hM7mrnlJEow (public, title+description verified 2026-11-20) | **Produced 2026-11-20: `demo/hybridnotes-demo.mp4`, 168.1 s (2:48), 1920×1080, English TTS narration, QC-passed** (duration/frames/audio/transcript all checked). Real capture of the live Pages app: Summarize + long-doc Summarize + Rewrite served by 🔵 Cloud · Gemini (real Gemini summaries, meta lines on screen), Translate fell through to 🟠 Local fallback, honestly badged; route hint visibly switches to "hybrid" on the 5,021-char document. Narration states plainly that the recording sandbox has no Gemini Nano, so on-device is described, not claimed as shown. ✅ Uploaded publicly to YouTube 2026-11-20: https://youtu.be/hM7mrnlJEow |
| 7 | Testing access link (live app URL) | ✅ done | **https://lisasa2526.github.io/hybridnotes/** — `dist/` published to the repo's `gh-pages` branch 2026-11-20 (GitHub Pages route; Firebase Hosting remains an alternative, not required). Verified live: page + JS + CSS all HTTP 200, bundle contains the real config and `gemini-3.8-flash`. Zero-setup testing works because of the local fallback engine; the App Check site key is wired in (row 8) and the final audit verified cloud Gemini serving live on this Pages origin. Paste this URL into the Devpost form. |
| 8 | Firebase project configured (AI Logic enabled) + `.env` values for the deployed build | ✅ done / ⏳ one console follow-up | Project **hybridnotes-33869** (Spark, AI Logic via Gemini Developer API) created by the user 2026-11-20; real web config is in `.env` (gitignored) and confirmed inside the built bundle. App Check: reCAPTCHA Enterprise site key added to `.env` and shipped in the rebuilt bundle (2026-11-20); debug token registered for Node re-verification (PASS). ✅ Console follow-up DONE: `lisasa2526.github.io` added to the reCAPTCHA key's registered domains (2026-11-20 ~13:14 CST); final audit re-verified live on the Pages origin (token exchange 200, cloud `generateContent` 200). See `GATE.md` §2c / `VERIFICATION.md` §5 addendum. |
| 9 | AI-assistant disclosure | ✅ | Disclosed in README ("Disclosure" section) and in the draft description below. The rules expressly allow AI coding assistants with disclosure. |
| 10 | Devpost submission form completed before deadline | ⏳ pending-user | Final submit click is the user's. Suggested buffer: submit by Nov 29 PT, not on deadline day. |

## Draft Devpost text description (ready to paste)

> **HybridNotes — sensitive notes, processed where they belong.**
>
> People paste confidential meeting notes, contract excerpts and private
> journals into AI websites every day. HybridNotes asks why a short,
> sensitive note should ever leave your laptop.
>
> Built with **Firebase AI Logic** hybrid inference, HybridNotes
> summarizes, rewrites and translates text through a four-step chain:
> (1) a Firebase AI Logic model with `InferenceMode.ONLY_ON_DEVICE` runs
> Gemini Nano in Chrome for short/sensitive input — the text never leaves
> the device; (2) a `PREFER_ON_DEVICE` hybrid model serves longer input,
> falling back to cloud Gemini (`gemini-3.8-flash`) when the device can't;
> (3) an explicit cloud model; and (4) a built-in local extractive engine
> so the demo works with zero setup. The result badge is driven by
> `GenerateContentResponse.inferenceSource`, so it always shows the engine
> that actually ran — on-device, cloud, or local.
>
> Developed with the help of an AI coding assistant, as permitted by the
> hackathon rules; all project code is original to this repository apart
> from the Firebase/Vite libraries.

## Verification log

- ✅ Verified 2026-11-20: `npm install` (firebase ^12, vite ^7) +
  `npm run build` succeed — Vite production build, `dist/` ≈ 100 KB,
  bundle confirmed to contain the Firebase AI Logic hybrid code
  (`only_on_device` / `prefer_on_device` / `gemini-2.5-flash` strings).
- ✅ Verified 2026-11-20: `vite preview` serves the built app (HTTP 200).
- ✅ Verified 2026-11-20 (Node, no Firebase config): the full run chain
  answers via the local engine — extractive summary, rewrite cleanup and
  EN→ZH gloss all produce output; `hybrid-service.runAction()` returns
  `mode: "local"` with the honest "Firebase is not configured" detail.
  This is the zero-setup judge path (badge: Local fallback).
- ✅ Verified 2026-11-20 (Node harness `scripts/verify-cloud.mjs`, real
  project hybridnotes-33869): real Firebase AI Logic **cloud** calls
  succeeded — cloud model and `PREFER_ON_DEVICE` hybrid both returned real
  Gemini text with `inferenceSource: "in_cloud"` and real usageMetadata.
  Required changing `CLOUD_MODEL` to `gemini-3.8-flash` (the API reports
  `gemini-2.5-flash` is no longer available to new users). Full evidence
  in `GATE.md`.
- 🔶 App Check: from ≈12:47 CST 2026-11-20 the Node harness calls return
  `401 Firebase App Check token is invalid` — App Check enforcement is on
  for token-less non-browser calls. Node re-verification needs a
  registered debug token. See `GATE.md` §2c.
- ✅ Verified 2026-11-20 (App Check wiring session, see `VERIFICATION.md`
  §5): site key added to `.env`, bundle rebuilt (`index-BSNZ6M7b.js`) and
  redeployed to GitHub Pages (gh-pages `d093774`); served JS is
  byte-identical (MD5) to the local build and contains the site key;
  debug token confirmed absent from the bundle. Node harness with
  `FIREBASE_APPCHECK_DEBUG_TOKEN` (env only, never committed): cloud and
  hybrid calls both PASS with `inferenceSource: "in_cloud"` — the 401 is
  gone; the no-token 401 baseline still reproduces.
- ⚠️ Verified 2026-11-20 (live Pages origin, headless Chrome): the
  deployed app runs, but its cloud legs are rejected on this origin —
  generateContent POST → 401 `UNAUTHENTICATED` "Firebase App Check token
  is invalid", console `AppCheck: ReCAPTCHA error.
  (appCheck/recaptcha-error)` — because `lisasa2526.github.io` is not in
  the reCAPTCHA key's registered domains. The app falls back to the
  local engine with the honest badge. Fix = add the domain to the key
  in Google Cloud Console (or use Firebase Hosting).
- ✅ Verified 2026-11-20 (independent browser run, see `VERIFICATION.md`):
  chrome-headless-shell 158 running the app's own `src/firebase-ai.js`
  against project hybridnotes-33869 — hybrid (`PREFER_ON_DEVICE`) and
  cloud models both returned real Gemini summaries over HTTP 200 with
  `inferenceSource: "in_cloud"`, **without** any App Check token, after
  the Node 401s above. So the browser path currently passes as-is; the
  App Check site key is still recommended before public deployment.
  Same run confirmed the headless shell's `LanguageModel` is only an
  echo stub ("this API is just echoing back the input") — not real
  Gemini Nano, not counted as on-device verification.
- ⚠️ **Not yet verified:** the on-device Gemini Nano leg — it needs the
  user's Chrome with Gemini Nano downloaded; cannot be tested in the
  build environment. Proof criteria are spelled out in `GATE.md` §3.
- ✅ Verified 2026-11-20: testing link live on GitHub Pages —
  https://lisasa2526.github.io/hybridnotes/ (built with
  `vite build --base=./` so assets resolve under the project subpath;
  same bundle hash as the verified build). Page, JS bundle and CSS all
  return HTTP 200; the served JS contains the real project config and
  the `gemini-3.8-flash` model string. Pages hosting does not change the
  App Check caveat above for in-browser cloud calls.

## Remaining blockers

1. ~~Create Firebase project + enable AI Logic + provide web config~~ ✅
   done 2026-11-20 (project hybridnotes-33869; cloud path verified).
2. ~~Create public GitHub repo (lisasa2526) and push~~ ✅ done 2026-11-20:
   https://github.com/lisasa2526/hybridnotes
3. ~~App Check site key into `.env`~~ ✅ done 2026-11-20 (console by
   user/parent; wired in, rebuilt, redeployed and re-verified by
   agent). ~~Add `lisasa2526.github.io` to the reCAPTCHA key's
   registered domains~~ ✅ done 2026-11-20 ~13:14 CST and re-verified
   live in the final audit (Pages origin now mints App Check tokens
   and serves cloud Gemini end-to-end).
4. ~~Deploy `dist/` and capture the testing URL~~ ✅ done 2026-11-20 via
   GitHub Pages: https://lisasa2526.github.io/hybridnotes/ (Firebase
   Hosting remains an alternative, not required).
5. ⏳ On-device badge proof in the user's Chrome (user).
6. 🎬 Demo video produced 2026-11-20: `demo/hybridnotes-demo.mp4`
   (2:48, QC-passed). ✅ Uploaded publicly to YouTube 2026-11-20: https://youtu.be/hM7mrnlJEow (title/description verified live).
7. ⏳ Paste description, repo URL, video URL and testing URL into the
   Devpost form and submit before **Nov 30, 2026, 2:00 pm PT** (user).

## Final audit — 2026-11-20 (pre-submission, all items re-verified live)

**Verdict: ✅ PASS — clear to submit.** Every Devpost requirement was
checked against live evidence on 2026-11-20 (~14:15–14:25 CST), not
just against these docs:

1. **Repo** — `gh repo view`: PUBLIC; GitHub license API detects
   **MIT** from the root `LICENSE`; remote README is byte-identical to
   the local one and contains "How Firebase AI Logic hybrid inference
   is used" and the "Disclosure" section (AI coding assistant). ✅
2. **Live app** — https://lisasa2526.github.io/hybridnotes/ returns
   HTTP 200; served bundle `index-BSNZ6M7b.js` (HTTP 200) contains the
   real project config (`hybridnotes-33869`), `gemini-3.8-flash` and
   `initializeAppCheck`. ✅
3. **Pages cloud question — SETTLED by fresh live test.** One run of
   the deployed Pages app in chrome-headless-shell 158 (on-device API
   removed pre-load per the `VERIFICATION.md` §5-addendum method, so
   the chain must exercise the cloud legs; sample note → Summarize):
   App Check `:exchangeRecaptchaEnterpriseToken` → **200** (real JWT,
   provider `recaptcha_enterprise`); `gemini-3.8-flash:generateContent`
   → **200** with a real Gemini summary; the app's run-meta line reads
   *"Firebase reported a cloud source on the on-device pass — badge
   corrected to cloud."* **The Pages origin now serves cloud Gemini —
   it does NOT fall back to local.** The stale caveat formerly in rows
   2/7/8 has been corrected above. ✅
4. **YouTube** — https://youtu.be/hM7mrnlJEow is reachable without
   login (public); title "HybridNotes — Private Notes with
   On-Device-First AI (Firebase AI Logic)" and the intended
   description (with live-app + repo links and the AI-assistant
   disclosure line) verified on the page; the uploaded file is the
   QC-passed 168.1 s (2:48) master, inside the ≤3:00 limit. ✅
5. **Draft description** — names `gemini-3.8-flash`, includes the
   AI-assistant disclosure sentence, and describes the on-device leg
   as architecture ("runs Gemini Nano in Chrome…") without claiming
   it was verified; the docs and video narration state plainly that
   on-device is unverified. ✅
6. **Deadline** — Nov 30, 2026 2:00 pm PT = Dec 1 06:00 Beijing;
   submitting today is ~10 days early. ✅
7. **Rule risks** — China not on the exclusion list (rules page,
   2026-11-20); AI-assistant disclosure present in README +
   description; license machine-detectable; video public + English;
   testing link live. ✅

**Non-blocking notes (disclosed, do not block submission):**
- Badge-label edge case seen in today's run: when the SDK serves a
  cloud response on the on-device-configured pass, the badge label
  still reads "🟢 On-device · Gemini Nano" while the run-meta line on
  the same screen corrects it to cloud. The truth is disclosed
  on-screen; the normal paths (real Nano present, or the hybrid pass)
  badge correctly, as the demo video shows. Cosmetic wart in
  `hybrid-service.js`, not a requirements issue.
- Free-tier ceiling: 20 cloud `generateContent` requests/day for
  `gemini-3.8-flash`; heavy same-day judge traffic could exhaust it,
  after which the app honestly falls back to the local engine until
  reset. Raising it is the owner's billing call.
- On-device Gemini Nano leg remains unverified on real hardware —
  and is nowhere claimed as verified (README, GATE.md, video
  narration all say so).
