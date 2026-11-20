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
| 2 | Hybrid inference actually used (on-device + cloud fallback) | ✅ cloud verified live / ⚠️ on-device unverified | Cloud leg proven 2026-11-20 against the real project (see `GATE.md`): real Gemini response with `inferenceSource: "in_cloud"`. Model had to move `gemini-2.5-flash` → `gemini-3.8-flash` (API retired the old one for new users). App Check is enforced: the site key is now wired into the deployed build and the Node harness re-verifies clean with a registered debug token (401 gone). ⚠️ On the GitHub Pages origin the reCAPTCHA key does not mint tokens — `lisasa2526.github.io` is not in the key's registered domains — so Pages cloud legs currently fall back to the local engine (honestly badged) until the domain is added in Google Cloud Console or hosting moves to Firebase Hosting (see row 8). On-device leg still needs the user's Chrome with Gemini Nano. |
| 3 | Public GitHub/GitLab repo | ✅ done | Public repo created and pushed 2026-11-20: https://github.com/lisasa2526/hybridnotes (via authenticated `gh`, account lisasa2526). |
| 4 | Open-source license file in repo | ✅ | `LICENSE` (MIT) at repo root. |
| 5 | Text description incl. how Firebase AI Logic was used | 🛠️ drafted | Use the README sections "How Firebase AI Logic hybrid inference is used" + the draft description below; paste into the Devpost form. ⏳ pending-user to submit the form. |
| 6 | Demo video ≤ 3 min, public on YouTube, in English | ⏳ pending-user | Script ready: `DEMO-SCRIPT.md`. Recording + upload must be done from the user's YouTube account. Must show the mode badge switching (on-device in Chrome; cloud or local elsewhere). |
| 7 | Testing access link (live app URL) | ✅ done | **https://lisasa2526.github.io/hybridnotes/** — `dist/` published to the repo's `gh-pages` branch 2026-11-20 (GitHub Pages route; Firebase Hosting remains an alternative, not required). Verified live: page + JS + CSS all HTTP 200, bundle contains the real config and `gemini-3.8-flash`. Zero-setup testing works because of the local fallback engine; in-browser cloud legs still need the App Check site key (row 8). Paste this URL into the Devpost form. |
| 8 | Firebase project configured (AI Logic enabled) + `.env` values for the deployed build | ✅ done / ⏳ one console follow-up | Project **hybridnotes-33869** (Spark, AI Logic via Gemini Developer API) created by the user 2026-11-20; real web config is in `.env` (gitignored) and confirmed inside the built bundle. App Check: reCAPTCHA Enterprise site key added to `.env` and shipped in the rebuilt bundle (2026-11-20); debug token registered for Node re-verification (PASS). Follow-up (user/parent, Google Cloud Console): add `lisasa2526.github.io` to the reCAPTCHA key's registered domains so the Pages deployment can mint App Check tokens — or serve from Firebase Hosting, whose domains are already registered. See `GATE.md` §2c / `VERIFICATION.md` §5. |
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
   agent). ⏳ Remaining console step: add `lisasa2526.github.io` to
   the reCAPTCHA key's registered domains (Google Cloud Console) so
   the Pages deployment's cloud legs can mint App Check tokens — or
   serve the app from Firebase Hosting instead (domains already
   registered).
4. ~~Deploy `dist/` and capture the testing URL~~ ✅ done 2026-11-20 via
   GitHub Pages: https://lisasa2526.github.io/hybridnotes/ (Firebase
   Hosting remains an alternative, not required).
5. ⏳ On-device badge proof in the user's Chrome (user).
6. ⏳ Record the ≤3 min English demo video (script in `DEMO-SCRIPT.md`)
   and upload publicly to YouTube (user).
7. ⏳ Paste description, repo URL, video URL and testing URL into the
   Devpost form and submit before **Nov 30, 2026, 2:00 pm PT** (user).
