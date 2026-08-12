import { generateJSON } from "../gemini/geminiClient";
import { buildContextPrompt } from "./buildContextPrompt";
import {
  getActivePlanWindow,
  getSalesPredictions,
  getWeatherForecast,
  getUpcomingHolidays,
} from "./contextEngineApi";

export class ContextEngineError extends Error {}

export async function generateContextInsight({ predictions, weather, holidays }) {
  const prompt = buildContextPrompt(predictions, weather, holidays);

  let parsed;
  try {
    parsed = await generateJSON(prompt);
  } catch (err) {
    throw new ContextEngineError(`Gemini call failed: ${err.message}`);
  }

  if (!parsed || !Array.isArray(parsed.recommendations)) {
    throw new ContextEngineError(
      `Unexpected response shape from Gemini: ${JSON.stringify(parsed)}`
    );
  }

  return parsed;
}


export async function refreshContextInsight({ latitude, longitude } = {}) {
  const plan = await getActivePlanWindow();

  const [predictionsRes, weatherRes, holidaysRes] = await Promise.all([
    getSalesPredictions(plan),
    getWeatherForecast(latitude, longitude, { startDate: plan.startDate, endDate: plan.endDate }),
    getUpcomingHolidays({ startDate: plan.startDate, endDate: plan.endDate }),
  ]);

  const predictions = predictionsRes.data;
  const weather = weatherRes.data;
  const holidays = holidaysRes.data;

  const insight = await generateContextInsight({ predictions, weather, holidays });

  return {
    planId: plan.planId,
    planName: plan.planName,
    planDays: plan.duration,
    predictions,
    weather,
    holidays,
    insight,
    generatedAt: new Date().toISOString(),
  };
}
