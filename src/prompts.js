// Prompt construction for the three HybridNotes actions.
// The same prompts are sent to whichever Gemini engine serves the request
// (on-device Gemini Nano or cloud Gemini), so results stay comparable and
// the mode badge — not the wording — is what changes between runs.

export function buildPrompt({ action, text, summaryLength = "medium", rewriteStyle = "clear", targetLang = "English" }) {
  switch (action) {
    case "summarize": {
      const lengthInstruction =
        summaryLength === "short"
          ? "Write a summary of 1–2 sentences capturing only the single most important point."
          : summaryLength === "detailed"
            ? "Write a summary paragraph, then a bullet list of the key points, decisions and action items (use '- ' bullets). If there are no action items, omit that part."
            : "Write a summary of one short paragraph (3–5 sentences) covering the main points.";
      return `${lengthInstruction}\n\nText to summarize:\n"""\n${text}\n"""`;
    }
    case "rewrite": {
      const styleInstruction =
        {
          clear: "Rewrite the text so it is clear and professional, fixing grammar and flow while keeping every fact and the original meaning.",
          concise: "Rewrite the text to be as concise as possible while keeping every key fact. Cut filler and repetition aggressively.",
          friendly: "Rewrite the text in a warm, friendly tone while keeping every fact and the original meaning.",
          formal: "Rewrite the text in a formal, businesslike tone while keeping every fact and the original meaning.",
        }[rewriteStyle] || "Rewrite the text clearly and professionally.";
      return `${styleInstruction}\n\nText to rewrite:\n"""\n${text}\n"""`;
    }
    case "translate": {
      return `Translate the following text into ${targetLang}. Preserve formatting, names and numbers. Output only the translation.\n\nText to translate:\n"""\n${text}\n"""`;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
