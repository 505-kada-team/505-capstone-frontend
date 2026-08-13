import { generateJSON } from "../gemini/geminiClient";
import { DATA_SOURCE_LABELS } from "./chatbotApi";

export async function pickRelevantSources(message) {
  const sourceList = Object.entries(DATA_SOURCE_LABELS)
    .map(([key, label]) => `- "${key}": ${label}`)
    .join("\n");

  const prompt = `
You are deciding which backend data sources are needed to answer a coffee
shop owner's question. Do not answer the question itself — only decide
which sources are relevant.

Available sources:
${sourceList}

Question: "${message}"

Rules:
- Only include sources that are actually relevant to answering this question.
- If the question is small talk, a greeting, or doesn't need any shop data
  at all, return an empty array.
- Use ONLY the exact keys listed above — never invent new keys.

Return ONLY valid JSON, exactly this shape:
{ "sources": ["key1", "key2"] }
`.trim();

  try {
    const parsed = await generateJSON(prompt, { maxRetries: 1 });
    const keys = Array.isArray(parsed?.sources) ? parsed.sources : [];
    return keys.filter((key) => key in DATA_SOURCE_LABELS);
  } catch (err) {
    console.warn("[chatbotRouter] Gagal menentukan sumber data, lanjut tanpa data tambahan:", err);
    return [];
  }
}
