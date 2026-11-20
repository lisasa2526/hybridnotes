// Hybrid inference service — the fallback chain behind every Run click.
//
//   1. ON-DEVICE  Firebase AI Logic model with InferenceMode.ONLY_ON_DEVICE
//                 (Gemini Nano in Chrome). Preferred for short/sensitive
//                 text: the input never leaves the machine.
//   2. HYBRID     Firebase AI Logic model with PREFER_ON_DEVICE, used for
//                 longer input. Firebase serves it on-device if possible
//                 and in the cloud otherwise; the response's
//                 `inferenceSource` field tells us which one actually ran,
//                 and that is what the badge shows.
//   3. CLOUD      A plain cloud Gemini model, if the hybrid call failed.
//   4. LOCAL      The built-in extractive engine (local-fallback.js), used
//                 when Firebase is not configured or every model call
//                 failed. The demo therefore works with zero setup.
//
// Every path returns { text, mode, detail, latencyMs } where mode is one of
// "on-device" | "cloud" | "local" — the UI badge renders exactly that.

import { getFirebaseModels, ensureDeviceModel } from "./firebase-ai.js";
import { isFirebaseConfigured } from "./firebase-config.js";
import { buildPrompt } from "./prompts.js";
import { runLocal } from "./local-fallback.js";

// Inputs up to this size are attempted strictly on-device first: they are
// the "sensitive snippet" case HybridNotes is built for. Longer documents
// go straight to the hybrid (prefer-on-device) model so a big paste doesn't
// waste time on a doomed on-device attempt.
const ON_DEVICE_MAX_CHARS = 4000;

async function callModel(model, prompt) {
  const result = await model.generateContent(prompt);
  const response = result.response;
  return {
    text: response.text(),
    inferenceSource: response.inferenceSource || null, // "on_device" | "in_cloud" | undefined
  };
}

export async function runAction(request, { onProgress } = {}) {
  const started = performance.now();
  const prompt = buildPrompt(request);
  const done = (text, mode, detail) => ({
    text,
    mode,
    detail,
    latencyMs: Math.round(performance.now() - started),
  });

  if (isFirebaseConfigured()) {
    const models = getFirebaseModels();
    // Must be triggered from the Run click (user interaction) per SDK docs.
    await ensureDeviceModel(onProgress);

    if (models) {
      // 1) Strictly on-device for short/sensitive text.
      if (request.text.length <= ON_DEVICE_MAX_CHARS) {
        try {
          const { text, inferenceSource } = await callModel(models.onDeviceModel, prompt);
          if (text?.trim()) {
            return done(
              text.trim(),
              "on-device",
              inferenceSource === "in_cloud"
                ? "Firebase reported a cloud source on the on-device pass — badge corrected to cloud."
                : "Gemini Nano ran locally in Chrome via Firebase AI Logic (ONLY_ON_DEVICE). Your text never left this device."
            );
          }
        } catch {
          // On-device model unavailable / not downloaded — fall through.
        }
      }

      // 2) Hybrid prefer-on-device (long input, or step 1 unavailable).
      try {
        const { text, inferenceSource } = await callModel(models.hybridModel, prompt);
        if (text?.trim()) {
          return inferenceSource === "on_device"
            ? done(text.trim(), "on-device", "Served by Gemini Nano on-device via the hybrid (PREFER_ON_DEVICE) model.")
            : done(
                text.trim(),
                "cloud",
                "Served by cloud Gemini via the hybrid (PREFER_ON_DEVICE) model — on-device could not serve this request."
              );
        }
      } catch {
        // Fall through to explicit cloud.
      }

      // 3) Cloud only.
      try {
        const { text } = await callModel(models.cloudModel, prompt);
        if (text?.trim()) {
          return done(text.trim(), "cloud", "Served by cloud Gemini via Firebase AI Logic.");
        }
      } catch {
        // Fall through to local.
      }
    }
  }

  // 4) Local extractive engine — zero setup, zero network.
  const text = runLocal(request.action, request);
  return done(
    text,
    "local",
    isFirebaseConfigured()
      ? "No Gemini model could serve this request, so the built-in local engine answered. Nothing was sent anywhere."
      : "Firebase is not configured in this deployment, so the built-in local engine answered. Nothing was sent anywhere."
  );
}

/** Human-readable engine status for the header, without making any calls. */
export function engineStatus() {
  if (!isFirebaseConfigured()) {
    return {
      firebase: false,
      label: "Local engine only — add Firebase config to enable Gemini Nano + cloud Gemini",
    };
  }
  return {
    firebase: true,
    label: "Firebase AI Logic ready — on-device first, cloud fallback, local last resort",
  };
}
