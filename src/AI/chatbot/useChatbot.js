import { useState, useCallback } from "react";
import { askChatbot } from "./chatbotService";
import { useContextEngineData } from "../contextEngine/ContextEngineContext";

export function useChatbot() {
  const [messages, setMessages] = useState([]); // [{ role, content, sourcesUsed? }]
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { result } = useContextEngineData();

  const sendMessage = useCallback(
    async (text) => {
      const userMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {

        const { reply, sourcesUsed } = await askChatbot({
          message: text,
          history: messages,
          contextEngine: result,
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, sourcesUsed },
        ]);
        return reply;
      } catch (err) {
        setError(err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong while getting a response.",
          },
        ]);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, result]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, clearMessages, isLoading, error };
}
