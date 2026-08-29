export class GeminiError extends Error {}

async function callGemini(prompt, { jsonMode = false, systemInstruction, temperature } = {}) {
  // Memanggil endpoint serverless kita sendiri
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      jsonMode,
      systemInstruction,
      temperature,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new GeminiError(
      `Gemini request failed (${response.status}): ${errData.error || 'Unknown error'}`
    );
  }

  const data = await response.json();
  return data.text;
}

export async function generateJSON(prompt, { maxRetries = 1, systemInstruction, temperature } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const text = await callGemini(prompt, { jsonMode: true, systemInstruction, temperature });
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

export async function generateText(prompt, { maxRetries = 1, systemInstruction, temperature } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(prompt, { jsonMode: false, systemInstruction, temperature });
    } catch (err) {
      lastError = err;
      console.warn(`[geminiClient] Text generation failed (attempt ${attempt + 1}):`, err);
    }
  }

  throw new GeminiError(
    `Failed to get a response after ${maxRetries + 1} attempt(s): ${lastError?.message}`
  );
}