const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.6-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {}

async function callGemini(prompt, { jsonMode = false } = {}) {
  if (!API_KEY) {
    throw new GeminiError(
      "VITE_GEMINI_API_KEY is missing. Add it to your .env file."
    );
  }

  const response = await fetch(
    `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(jsonMode
          ? { generationConfig: { responseMimeType: "application/json" } }
          : {}),
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new GeminiError(
      `Gemini request failed (${response.status}): ${errBody}`
    );
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new GeminiError(`Unexpected Gemini response shape: ${JSON.stringify(data)}`);
  }

  return text;
}

export async function generateJSON(prompt, { maxRetries = 1 } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const text = await callGemini(prompt, { jsonMode: true });
      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      console.warn(`[geminiClient] JSON generation failed (attempt ${attempt + 1}):`, err);
    }
  }

  throw new GeminiError(
    `Failed to get a valid JSON response after ${maxRetries + 1} attempt(s): ${lastError?.message}`
  );
}

export async function generateText(prompt, { maxRetries = 1 } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(prompt, { jsonMode: false });
    } catch (err) {
      lastError = err;
      console.warn(`[geminiClient] Text generation failed (attempt ${attempt + 1}):`, err);
    }
  }

  throw new GeminiError(
    `Failed to get a response after ${maxRetries + 1} attempt(s): ${lastError?.message}`
  );
}
