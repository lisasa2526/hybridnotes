# HybridNotes

**Sensitive notes, processed where they belong — on your device.**

HybridNotes is a privacy-first web app that summarizes, rewrites, and
translates notes and meeting text using **Firebase AI Logic hybrid
inference**: short, sensitive text is processed **on-device** by Gemini Nano
in Chrome so it never leaves the machine; long documents — or devices
without the on-device model — automatically fall back to **cloud Gemini**.
Every result carries a badge that shows which engine actually ran.

Built for the **#BuildHybridAI** hackathon (Google / Firebase, Devpost).

## The problem

People paste their most sensitive text into AI websites all day: meeting
notes with salaries and legal risks, private journals, contract excerpts,
medical letters. Every one of those pastes is an upload to a stranger's
server. HybridNotes answers a simple question: *why should a two-paragraph
confidential note ever leave your laptop?* With hybrid inference, it
doesn't have to — and when a job genuinely needs the cloud, the app says so
out loud instead of hiding it.

## How Firebase AI Logic hybrid inference is used

All Gemini access goes through **Firebase AI Logic** (`firebase/ai` in the
Firebase JS SDK v12) with a `GoogleAIBackend`. The code lives in
`src/firebase-ai.js` (initialization) and `src/hybrid-service.js` (the
runtime fallback chain). Firebase AI Logic is imported at the top of
`firebase-ai.js` and is **actually called at runtime** on every Run click
whenever Firebase is configured:

1. **On-device pass** — a model created with
   `mode: InferenceMode.ONLY_ON_DEVICE`. This runs Gemini Nano through
   Chrome's built-in model. It throws when the on-device model is
   unavailable, which is what drives the fallback. Used for inputs up to
   4,000 characters — the "sensitive snippet" case.
2. **Hybrid pass** — a model created with
   `mode: InferenceMode.PREFER_ON_DEVICE` and
   `inCloudParams: { model: "gemini-3.8-flash" }`. Firebase serves the
   request on-device if it can and in the cloud otherwise. We read
   `GenerateContentResponse.inferenceSource` (`"on_device"` / `"in_cloud"`)
   and the UI badge reports **that**, not our guess.
3. **Cloud pass** — a plain cloud `gemini-3.8-flash` model, if the hybrid
   call itself failed.
4. **Local pass** — a built-in extractive engine (`src/local-fallback.js`,
   plain JavaScript, zero network). This guarantees the public demo works
   in any browser with **zero setup** — no Firebase project required. The
   badge honestly switches to "Local fallback" so judges are never misled
   about which engine produced a result.

The on-device model download is triggered via
`GenerativeModel.initializeDeviceModel()` from the Run button click (the
SDK requires a user interaction before a download), with progress shown in
the UI.

### Mode badge

| Badge | Meaning |
| --- | --- |
| 🟢 On-device · Gemini Nano | Inference ran locally in Chrome. The text never left the device. |
| 🔵 Cloud · Gemini | Cloud Gemini served the request via Firebase AI Logic. |
| 🟠 Local fallback · built-in engine | No Gemini model served the request (or Firebase is unconfigured); the built-in extractive engine answered locally. |

## Features

- **Summarize** — short / medium / detailed (detailed adds key points).
- **Rewrite** — clear & professional, concise, friendly, or formal.
- **Translate** — into English, Simplified Chinese, Spanish, French,
  German, or Japanese (via Gemini; the offline engine offers only a rough
  EN↔ZH word gloss and says so).
- Live routing hint ("on-device first" vs "hybrid") based on input length.
- One-click sample confidential meeting note for instant testing.
- Responsive, dependency-light UI (Vite + vanilla JS, no UI framework).

## Run it locally

Requirements: Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173 — works immediately, local engine
npm run build      # production build into dist/
npm run preview    # serve the production build
```

With no Firebase configuration the app runs entirely on the built-in local
engine — that is deliberate, so anyone can test the product instantly.

## Configure Firebase (enables Gemini Nano + cloud Gemini)

1. Create a Firebase project and register a Web app in the
   [Firebase console](https://console.firebase.google.com/).
2. In the console, enable **AI Logic** (Gemini Developer API) for the
   project.
3. Copy `.env.example` to `.env` and fill in your web app config:

   ```bash
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. Restart `npm run dev`. The header status turns green:
   "Firebase AI Logic ready".

Optional but recommended for production: set
`VITE_FIREBASE_APPCHECK_SITE_KEY` to a reCAPTCHA Enterprise site key and
register it under **Firebase App Check**, so the AI Logic endpoint is
protected from abuse. `src/firebase-ai.js` initializes App Check
automatically when the key is present. (A Firebase web `apiKey` is an
identifier rather than a secret, but App Check + API key restrictions are
still the right production posture.)

**On-device requirements:** Gemini Nano runs in Chrome on desktop with the
built-in Prompt API available and sufficient device capability; the first
use may download the model (progress is shown). On browsers/devices
without it, HybridNotes transparently falls back to cloud Gemini — try the
same text in a non-Chrome browser to watch the badge change.

## Architecture

```
index.html                  App shell, privacy explainer, two-pane workspace
src/
  main.js                   UI wiring: actions, options, badge, run flow
  style.css                 Product UI styling (no external assets)
  firebase-config.js        Reads VITE_FIREBASE_* env vars; "configured?" check
  firebase-ai.js            Firebase app + AI Logic init, App Check,
                            ONLY_ON_DEVICE / PREFER_ON_DEVICE / cloud models,
                            initializeDeviceModel() wrapper
  hybrid-service.js         The fallback chain: on-device → hybrid → cloud →
                            local; returns { text, mode, detail, latencyMs }
  prompts.js                One prompt per action, shared by all engines
  local-fallback.js         Extractive summarizer, conservative rewrite
                            cleanup, honest EN↔ZH gloss
```

## Testing access

Deploy `dist/` to any static host (e.g. Firebase Hosting) or run locally
with the commands above. No account, login, or API key is needed to test:
without Firebase config the local engine answers; with config, the Gemini
engines take over automatically.

## Known limitations (stated honestly)

- The on-device Gemini Nano pass depends on Chrome's built-in model
  availability on the judge's/user's machine; where it is absent, the
  badge will show cloud or local instead — by design.
- The local fallback is an extractive engine, not an LLM: its summaries
  quote the source sentences, its "rewrite" is conservative cleanup, and
  its translation is a rough word-level EN↔ZH gloss. It exists so the demo
  never dead-ends, and it is labelled as such everywhere it appears.
- Long inputs (>4,000 chars) skip the strict on-device attempt and go to
  the hybrid model directly.

## License

MIT — see [LICENSE](./LICENSE).

## Disclosure

This project was developed with the help of an AI coding assistant, as
expressly permitted by the #BuildHybridAI rules, with the disclosure made
here and in the submission. All code in this repository is original to this
project except the Firebase and Vite libraries it depends on.
