import { generateText } from "../gemini/geminiClient";
import { buildChatbotPrompt, CHATBOT_SYSTEM_INSTRUCTION } from "./buildChatbotPrompt";
import { pickRelevantSources } from "./chatbotRouter";
import { fetchSources } from "./chatbotApi";

export async function askChatbot({ message, history, contextEngine }) {
  // 1. THINK — data apa yang sebenarnya dibutuhkan untuk jawab ini?
  const sourceKeys = await pickRelevantSources(message);

  // 2. FETCH — cuma yang dibutuhkan
  const appData = await fetchSources(sourceKeys);

  // 3. ANSWER
  const prompt = buildChatbotPrompt({ message, history, appData, contextEngine, usedSources: sourceKeys });
  const reply = await generateText(prompt, {
    systemInstruction: CHATBOT_SYSTEM_INSTRUCTION,
    temperature: 0.2,
  });

  return { reply: reply.trim(), sourcesUsed: sourceKeys };
}