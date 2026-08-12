import { generateText } from "../gemini/geminiClient";
import { buildChatbotPrompt } from "./buildChatbotPrompt";
import { pickRelevantSources } from "./chatbotRouter";
import { fetchSources } from "./chatbotApi";

export async function askChatbot({ message, history, contextEngine }) {
  const sourceKeys = await pickRelevantSources(message);

  const appData = await fetchSources(sourceKeys);

  const prompt = buildChatbotPrompt({ message, history, appData, contextEngine, usedSources: sourceKeys });
  const reply = await generateText(prompt);

  return { reply: reply.trim(), sourcesUsed: sourceKeys };
}