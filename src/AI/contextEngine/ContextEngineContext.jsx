import { createContext, useContext, useState, useCallback } from "react";
import { refreshContextInsight } from "./contextEngineService";

const STORAGE_KEY = "ai:contextInsight";

const ContextEngineContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
  }
}

export function ContextEngineProvider({ children }) {
  const [result, setResult] = useState(() => loadFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ latitude, longitude } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const next = await refreshContextInsight({ latitude, longitude });
      setResult(next);
      saveToStorage(next);
      return next;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    result,
    recommendations: result?.insight?.recommendations ?? [],
    isLoading,
    error,
    refresh,
    clear,
  };

  return (
    <ContextEngineContext.Provider value={value}>
      {children}
    </ContextEngineContext.Provider>
  );
}

export function useContextEngineData() {
  const ctx = useContext(ContextEngineContext);

  if (!ctx) {
    throw new Error("useContextEngineData must be used inside ContextEngineProvider");
  }

  return ctx;
}
