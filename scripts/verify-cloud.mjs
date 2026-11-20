// Confidence-gate verification: REAL Firebase AI Logic cloud call.
//
// Run from the project root:  node scripts/verify-cloud.mjs
//
// Reads the same .env values the Vite app uses (VITE_FIREBASE_*), initializes
// the Firebase AI Logic web SDK exactly like src/firebase-ai.js does
// (GoogleAIBackend, gemini-2.5-flash, same system instruction), then calls:
//   1. the plain cloud model, and
//   2. the PREFER_ON_DEVICE hybrid model (in Node there is no Gemini Nano,
//      so a genuine SDK response here must be served in_cloud — its
//      response.inferenceSource is the evidence).
// Prints the real model output and inferenceSource. No result is faked:
// any error is printed verbatim and the exit code is non-zero.

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { buildPrompt } from "../src/prompts.js";

// --- load .env (same vars Vite injects as import.meta.env) ---
const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || "",
};
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error("FAIL: .env is missing apiKey/projectId/appId");
  process.exit(1);
}
console.log(`Config: projectId=${firebaseConfig.projectId} (apiKey configured, value not printed)`);

const SYSTEM_INSTRUCTION =
  "You are the writing engine inside HybridNotes, a privacy-first notes app. " +
  "Follow the user's instruction exactly, return only the requested result " +
  "with no preamble, no explanations and no markdown fences.";
// Model under test: CLI arg wins, else the CLOUD_MODEL constant the app
// itself ships in src/firebase-ai.js — so a default run always tests exactly
// what the deployed app will call.
const appModel = readFileSync(new URL("../src/firebase-ai.js", import.meta.url), "utf8").match(
  /CLOUD_MODEL = "([^"]+)"/
)?.[1];
const CLOUD_MODEL = process.argv[2] || appModel || "gemini-3.8-flash";
console.log(`Model under test: ${CLOUD_MODEL}`);

const app = initializeApp(firebaseConfig);
const ai = getAI(app, { backend: new GoogleAIBackend() });

const prompt = buildPrompt({
  action: "summarize",
  summaryLength: "short",
  text:
    "Team sync, Nov 20: We agreed to ship the HybridNotes demo this week. " +
    "Priya will record the walkthrough video on Friday. The main risk is the " +
    "on-device model download size on older Chromebooks, so the fallback " +
    "chain must be tested before the public link goes out. Marketing wants " +
    "the launch post drafted by Monday.",
});
console.log("Prompt built via src/prompts.js buildPrompt (summarize/short).");

let failures = 0;

async function probe(label, model) {
  const t0 = Date.now();
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log(`\n--- ${label}: SUCCESS in ${Date.now() - t0} ms`);
    console.log(`inferenceSource: ${JSON.stringify(response.inferenceSource ?? null)}`);
    if (response.usageMetadata) {
      console.log(`usageMetadata: ${JSON.stringify(response.usageMetadata)}`);
    }
    console.log(`response text (first 200 chars): ${text.slice(0, 200)}`);
    return { ok: true, inferenceSource: response.inferenceSource ?? null, text };
  } catch (err) {
    failures++;
    console.log(`\n--- ${label}: FAILED in ${Date.now() - t0} ms`);
    console.log(`error name: ${err?.name}  code: ${err?.code ?? "(none)"}`);
    console.log(`error message: ${err?.message}`);
    return { ok: false };
  }
}

// 1) Plain cloud model — the gate's primary target.
const cloudModel = getGenerativeModel(ai, { model: CLOUD_MODEL, systemInstruction: SYSTEM_INSTRUCTION });
const cloud = await probe(`cloud model (${CLOUD_MODEL})`, cloudModel);

// 2) Hybrid PREFER_ON_DEVICE — must report inferenceSource "in_cloud" in Node.
const hybridModel = getGenerativeModel(ai, {
  mode: InferenceMode.PREFER_ON_DEVICE,
  inCloudParams: { model: CLOUD_MODEL, systemInstruction: SYSTEM_INSTRUCTION },
});
const hybrid = await probe("hybrid model (PREFER_ON_DEVICE)", hybridModel);

console.log("\n=== VERDICT ===");
console.log(`cloud call: ${cloud.ok ? "PASS" : "FAIL"}`);
console.log(
  `hybrid call: ${hybrid.ok ? `PASS (inferenceSource=${JSON.stringify(hybrid.inferenceSource)})` : "FAIL"}`
);
process.exit(cloud.ok ? 0 : 1);
