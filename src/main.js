// HybridNotes UI wiring.

import { runAction, engineStatus } from "./hybrid-service.js";

const $ = (id) => document.getElementById(id);

const inputEl = $("input-text");
const outputEl = $("output");
const badgeEl = $("mode-badge");
const runBtn = $("run-btn");
const copyBtn = $("copy-btn");
const charCountEl = $("char-count");
const routeHintEl = $("route-hint");
const runMetaEl = $("run-meta");
const progressEl = $("progress");
const statusEl = $("engine-status");

const optionBlocks = {
  summarize: $("opt-length"),
  rewrite: $("opt-style"),
  translate: $("opt-lang"),
};

let currentAction = "summarize";
let lastResult = "";

const SAMPLE = `Q3 planning meeting — confidential, do not forward.

We reviewed the delayed supplier contract. The legal team flagged a risk: the penalty clause could cost us up to 40,000 if delivery slips past November 15. Finance confirmed the budget for the pilot is approved at 120,000, but any overrun needs a new sign-off.

Decision: we will launch the pilot with the current supplier on October 28, and in parallel qualify a backup supplier. Action item for Priya: draft the backup supplier shortlist by Friday. Action item for Tom: confirm the penalty clause wording with legal before signing anything.

Marketing reported that early customer interviews were positive — 8 of 10 customers said the onboarding felt simpler — but two customers raised privacy concerns about uploading sensitive documents to a cloud service. This is now a key product requirement: anything sensitive must be processed on the user's own device whenever possible.

Next step: weekly check-in every Monday at 10:00 until launch. Next milestone is the internal demo on November 6.`;

function setAction(action) {
  currentAction = action;
  document.querySelectorAll(".tab").forEach((tab) => {
    const active = tab.dataset.action === action;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  for (const [key, el] of Object.entries(optionBlocks)) {
    el.classList.toggle("hidden", key !== action);
  }
  updateRouteHint();
}

function updateCounts() {
  const n = inputEl.value.length;
  charCountEl.textContent = `${n.toLocaleString()} character${n === 1 ? "" : "s"}`;
  updateRouteHint();
}

function updateRouteHint() {
  const n = inputEl.value.length;
  routeHintEl.textContent =
    n === 0
      ? ""
      : n <= 4000
        ? "Route: on-device first (short / sensitive)"
        : "Route: hybrid — cloud may serve long documents";
}

function setBadge(mode, detail) {
  const labels = {
    "on-device": "🟢 On-device · Gemini Nano",
    cloud: "🔵 Cloud · Gemini",
    local: "🟠 Local fallback · built-in engine",
    none: "No run yet",
  };
  badgeEl.className = `mode-badge mode-${mode}`;
  badgeEl.textContent = labels[mode] || labels.none;
  badgeEl.title = detail || "";
}

function showProgress(message) {
  progressEl.textContent = message;
  progressEl.classList.remove("hidden");
}
function hideProgress() {
  progressEl.classList.add("hidden");
  progressEl.textContent = "";
}

async function handleRun() {
  const text = inputEl.value.trim();
  if (!text) {
    outputEl.innerHTML = '<p class="placeholder">Paste some text first — or load the sample meeting note.</p>';
    return;
  }

  runBtn.disabled = true;
  runBtn.textContent = "Running…";
  copyBtn.disabled = true;
  setBadge("none");
  badgeEl.textContent = "Working…";

  try {
    const result = await runAction(
      {
        action: currentAction,
        text,
        summaryLength: $("summary-length").value,
        rewriteStyle: $("rewrite-style").value,
        targetLang: $("target-lang").value,
      },
      {
        onProgress: (p) => {
          if (typeof p === "number" && p > 0 && p < 1) {
            showProgress(`Downloading the on-device Gemini Nano model… ${Math.round(p * 100)}% (one-time)`);
          }
        },
      }
    );

    lastResult = result.text;
    outputEl.textContent = result.text;
    setBadge(result.mode, result.detail);
    runMetaEl.textContent = `${result.detail} · ${result.latencyMs} ms`;
    copyBtn.disabled = !result.text;
  } catch (err) {
    outputEl.innerHTML = "";
    outputEl.textContent = `Something went wrong: ${err?.message || err}`;
    setBadge("none");
  } finally {
    hideProgress();
    runBtn.disabled = false;
    runBtn.textContent = "Run";
  }
}

// --- wiring ---------------------------------------------------------------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setAction(tab.dataset.action));
});

$("sample-btn").addEventListener("click", () => {
  inputEl.value = SAMPLE;
  updateCounts();
  inputEl.focus();
});

copyBtn.addEventListener("click", async () => {
  if (!lastResult) return;
  try {
    await navigator.clipboard.writeText(lastResult);
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy result"), 1500);
  } catch {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => (copyBtn.textContent = "Copy result"), 1500);
  }
});

runBtn.addEventListener("click", handleRun);
inputEl.addEventListener("input", updateCounts);

const status = engineStatus();
statusEl.textContent = status.label;
statusEl.classList.add(status.firebase ? "status-ready" : "status-local");

setAction("summarize");
updateCounts();
