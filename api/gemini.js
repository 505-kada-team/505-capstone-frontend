export default async function handler(req, res) {
  // Hanya ijinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
  }

  const { prompt, jsonMode, systemInstruction, temperature } = req.body;

  try {
    const response = await fetch(
      `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...(systemInstruction
            ? { system_instruction: { parts: [{ text: systemInstruction }] } }
            : {}),
          generationConfig: {
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
            ...(temperature !== undefined ? { temperature } : {}),
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${errBody}` });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      return res.status(500).json({ error: 'Unexpected response shape from Gemini' });
    }

    // Kembalikan text hasil generate
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}