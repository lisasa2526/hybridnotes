# Demo Video Script — HybridNotes (target: 2:30, hard limit 3:00)

Format: screen recording of the live app in Chrome, English voiceover.
Record at 1080p. Have the Firebase-configured build deployed beforehand so
the on-device and cloud badges can both appear. Timestamps are cumulative.

---

**[0:00–0:15] Hook — the problem**

> "Every day, people paste their most sensitive text — meeting notes with
> salaries, legal risks, private journals — into AI websites. Every paste
> is an upload. HybridNotes asks: why should a short confidential note ever
> leave your laptop?"

*On screen: the HybridNotes header and the three-step privacy strip.*

**[0:15–0:40] The product + the sample**

> "This is HybridNotes. It summarizes, rewrites, and translates notes —
> built on Firebase AI Logic with hybrid inference. Let me load a sample
> confidential meeting note: a delayed supplier contract, a penalty clause,
> a launch decision."

*On screen: click "Load a sample meeting note". Point at the route hint:
"on-device first (short / sensitive)".*

**[0:40–1:10] Run 1 — on-device (the money shot)**

> "I click Run. Watch the badge."

*On screen: click Run; the result appears with the green badge.*

> "Green badge: On-device, Gemini Nano. Firebase AI Logic ran this with
> InferenceMode ONLY_ON_DEVICE — the model inside Chrome. This text never
> left the machine. No server saw it. And the summary is exactly what I
> need: the decision, the risk, the action items."

**[1:10–1:40] Run 2 — cloud fallback for a long document**

> "Now a much longer document. The route hint switches to hybrid. When the
> on-device model can't serve a request, Firebase AI Logic falls back to
> cloud Gemini — and the badge tells the truth: blue, Cloud."

*On screen: paste a long text (several thousand characters), Run, show the
blue badge. If the hybrid model happens to serve it on-device, say instead:
"Firebase decided the device could handle it — and the badge reports what
actually ran, straight from the response's inferenceSource." Then cut to
the pre-recorded cloud-badge run.*

**[1:40–2:00] Run 3 — zero-setup local fallback**

> "And if there's no Firebase configuration at all — like a judge opening
> the link cold — HybridNotes still answers, with a built-in local engine.
> The badge turns orange: Local fallback. No dead ends, and no pretending
> a local engine is an LLM."

*On screen: the unconfigured deployment (or a browser without Gemini
Nano), Run, orange badge.*

**[2:00–2:20] Rewrite + translate, quickly**

> "Same chain powers Rewrite — clear, concise, friendly, formal — and
> Translate, into six languages. One prompt set, three engines, one honest
> badge."

*On screen: one quick Rewrite run and one quick Translate run; keep each
under ~7 seconds of screen time.*

**[2:20–2:30] Close**

> "HybridNotes: private by default, cloud only when needed, honest
> always. Built with Firebase AI Logic hybrid inference. Thank you."

*On screen: header + all three badge colors visible in the run history /
final frame.*

---

## Recording notes

- Do a rehearsal run first: the first on-device Run may download the
  Gemini Nano model (progress bar appears) — either record that download
  once beforehand so the take is instant, or keep the download in the cut
  and mention "one-time model download" in voiceover.
- Keep the cursor slow and deliberate; judges scrub fast.
- Export ≤ 3:00 total, upload as **Public** on YouTube, title:
  "HybridNotes — Private notes, summarized on your device (#BuildHybridAI)".
- Add the live app URL and GitHub repo URL to the video description.
