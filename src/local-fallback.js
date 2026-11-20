// Built-in local engine — zero network, zero configuration.
//
// Purpose: HybridNotes must work for anyone who opens the demo link, in any
// browser, even with no Firebase project configured. When neither the
// on-device Gemini Nano model nor cloud Gemini can serve a request, this
// engine answers instead, and the UI badge honestly says "Local fallback".
//
// What it can do:
//   - Summarize: real extractive summarization (sentence scoring by word
//     frequency, position and cue phrases). No text ever leaves the device.
//   - Rewrite: conservative cleanup — whitespace/paragraph normalization,
//     filler-phrase removal, sentence capitalization. It does NOT pretend
//     to paraphrase like an LLM.
//   - Translate: a small phrase/word gloss for common English↔Chinese
//     business vocabulary. Clearly labelled as a rough gloss, not a full
//     translation. For other language pairs it returns the input with an
//     explanation instead of fabricating a translation.

const STOPWORDS = new Set(
  ("a an the and or but if then else when while of at by for with about into through after over between out against during without before under around among is are was were be been being have has had do does did will would shall should can could may might must i you he she it we they them his her its our their this that these those am an as so than too very just not no yes in on to from").split(" ")
);

const CUE_PHRASES = [
  "decided", "decision", "action item", "deadline", "important", "key point",
  "agreed", "must", "risk", "budget", "launch", "next step", "follow up",
];

function splitSentences(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const matches = cleaned.match(/[^.!?…。！？]+[.!?…。！？]+["')\]]*|[^.!?…。！？]+$/g);
  return (matches || [cleaned]).map((s) => s.trim()).filter(Boolean);
}

function tokenize(sentence) {
  return (sentence.toLowerCase().match(/[a-z0-9']+|[\u4e00-\u9fa5]/g) || []).filter(
    (w) => !STOPWORDS.has(w) && w.length > 1
  );
}

export function localSummarize(text, summaryLength = "medium") {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return "";
  if (sentences.length <= 2) return sentences.join(" ");

  const freq = new Map();
  for (const s of sentences) for (const w of tokenize(s)) freq.set(w, (freq.get(w) || 0) + 1);
  const maxFreq = Math.max(...freq.values(), 1);

  const scored = sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    let score = words.reduce((acc, w) => acc + (freq.get(w) || 0) / maxFreq, 0) / Math.max(words.length, 1);
    if (index === 0) score *= 1.25; // lead bias
    const lower = sentence.toLowerCase();
    for (const cue of CUE_PHRASES) if (lower.includes(cue)) score *= 1.3;
    if (sentence.length > 300) score *= 0.7; // avoid rambling sentences
    return { sentence, index, score };
  });

  const keepCount =
    summaryLength === "short" ? 2 : summaryLength === "detailed" ? Math.min(6, Math.ceil(sentences.length / 2)) : 3;

  const chosen = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .sort((a, b) => a.index - b.index);

  if (summaryLength === "detailed") {
    const lead = chosen[0]?.sentence || "";
    const rest = chosen.slice(1).map((c) => `- ${c.sentence}`).join("\n");
    return rest ? `${lead}\n\nKey points:\n${rest}` : lead;
  }
  return chosen.map((c) => c.sentence).join(" ");
}

const FILLERS = [
  /\bjust wanted to say that\b/gi, /\bi think that\b/gi, /\bbasically,?\s*/gi,
  /\bactually,?\s*/gi, /\bin my opinion,?\s*/gi, /\byou know,?\s*/gi,
  /\s{2,}/g,
];

export function localRewrite(text, style = "clear") {
  let out = text.replace(/\r\n/g, "\n").trim();
  for (const pattern of FILLERS) out = out.replace(pattern, " ");
  // Capitalize sentence starts.
  out = out.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (m) => m.toUpperCase());
  // Normalize paragraph breaks and trailing spaces.
  out = out
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
  if (style === "concise") {
    const sentences = splitSentences(out);
    out = sentences.filter((s) => s.length > 12).join(" ") || out;
  }
  return out;
}

// Small EN↔ZH gloss for common meeting/business vocabulary. Deliberately
// tiny and honest: it demonstrates the offline path, it is not an MT engine.
const GLOSS_EN_ZH = new Map(Object.entries({
  meeting: "会议", summary: "摘要", project: "项目", deadline: "截止日期",
  budget: "预算", team: "团队", decision: "决定", decided: "决定",
  launch: "发布", risk: "风险", report: "报告", schedule: "日程",
  customer: "客户", revenue: "收入", plan: "计划", next: "下一步",
  week: "周", today: "今天", tomorrow: "明天", important: "重要",
  update: "更新", review: "审查", approve: "批准", contract: "合同",
  private: "私密", note: "笔记", notes: "笔记", the: "", and: "和",
  we: "我们", will: "将", to: "到", of: "的", in: "在", for: "为",
}));
const GLOSS_ZH_EN = new Map([...GLOSS_EN_ZH.entries()].filter(([, v]) => v).map(([k, v]) => [v, k]));

export function localTranslate(text, targetLang) {
  const target = (targetLang || "").toLowerCase();
  if (target.includes("chinese")) {
    const glossed = text.replace(/[A-Za-z']+/g, (w) => {
      const hit = GLOSS_EN_ZH.get(w.toLowerCase());
      return hit === undefined ? w : hit || "";
    });
    return `[Local gloss — rough word-level rendering, configure Firebase for full translation]\n${glossed}`;
  }
  if (target.includes("english") && /[\u4e00-\u9fa5]/.test(text)) {
    let out = text;
    for (const [zh, en] of GLOSS_ZH_EN) out = out.split(zh).join(` ${en} `);
    return `[Local gloss — rough word-level rendering, configure Firebase for full translation]\n${out.replace(/\s+/g, " ").trim()}`;
  }
  return `[Local fallback cannot translate into ${targetLang} offline. Configure Firebase AI Logic for cloud/on-device translation. Showing your original text unchanged:]\n${text}`;
}

export function runLocal(action, { text, summaryLength, rewriteStyle, targetLang }) {
  switch (action) {
    case "summarize":
      return localSummarize(text, summaryLength);
    case "rewrite":
      return localRewrite(text, rewriteStyle);
    case "translate":
      return localTranslate(text, targetLang);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
