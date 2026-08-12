import { getPlanList } from "@/services/api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const toISODate = (date) => date.toISOString().slice(0, 10);

// =============================================================================
// ACTIVE PLAN WINDOW
// Context engine cuma jalan kalau ada production plan yang sedang active.
// =============================================================================

export const getActivePlanWindow = async () => {
  const res = await getPlanList({ status: "active" });
  const active = res.data?.[0];

  if (!active) {
    throw new Error(
      "Tidak ada production plan berstatus 'active' saat ini — context engine butuh 1 plan active untuk jalan."
    );
  }

  return {
    planId: active._id,
    planName: active.name,
    startDate: new Date(active.startDate),
    endDate: new Date(active.endDate),
    duration: active.duration,
    tags: active.tags ?? [],
  };
};

// =============================================================================
// ML SALES PREDICTIONS
// Service ML terpisah (repo Python/FastAPI sendiri) — bukan lewat backend
// Express. POST /predict-assortment, body: { duration, startDate, tags }.
// =============================================================================

export const getSalesPredictions = async (plan) => {
  const baseUrl = import.meta.env.VITE_ML_API_URL;
  if (!baseUrl) {
    throw new Error("VITE_ML_API_URL belum diisi di .env — dibutuhkan untuk manggil service ML prediction.");
  }

  const response = await fetch(`${baseUrl}/predict-assortment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      duration: plan.duration,
      startDate: plan.startDate.toISOString(),
      tags: plan.tags,
    }),
  });

  if (!response.ok) {
    throw new Error(`ML prediction API failed: ${response.status}`);
  }

  const raw = await response.json();
  // raw: [{ menuId, name, recommendedQuantity }, ...] — maks 10 item,
  // sudah diurutkan quantity terbesar oleh service-nya sendiri.
  const predictions = raw.map((item) => ({
    menu: item.name,
    quantity: item.recommendedQuantity,
    menuId: item.menuId,
  }));

  return { data: predictions };
};

// =============================================================================
// WEATHER FORECAST
// Open-Meteo — gratis, tanpa API key. Discope ke rentang tanggal plan.
// Cuma reliable ~16 hari ke depan dari HARI INI (keterbatasan provider,
// bukan bug) — kalau plan lebih panjang, sisanya gak ke-cover.
// =============================================================================

const MAX_WEATHER_DAYS_AHEAD = 16;

export const getWeatherForecast = async (latitude = -6.35, longitude = 107.15, { startDate, endDate }) => {
  const today = new Date();
  const rangeStart = startDate > today ? startDate : today;
  const maxEnd = new Date(today.getTime() + MAX_WEATHER_DAYS_AHEAD * MS_PER_DAY);
  const rangeEnd = endDate < maxEnd ? endDate : maxEnd;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,precipitation_probability_max&timezone=auto` +
    `&start_date=${toISODate(rangeStart)}&end_date=${toISODate(rangeEnd)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API failed: ${response.status}`);
  }

  const raw = await response.json();

  return {
    data: {
      dates: raw.daily?.time ?? [],
      temperature_max: raw.daily?.temperature_2m_max ?? [],
      rain_probability: raw.daily?.precipitation_probability_max ?? [],
    },
  };
};

// =============================================================================
// UPCOMING HOLIDAYS
// API hari libur publik Indonesia, tanpa key. Discope ke rentang tanggal plan.
// =============================================================================

export const getUpcomingHolidays = async ({ startDate, endDate }) => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const years = [];
  for (let year = startYear; year <= endYear; year++) years.push(year);

  const responses = await Promise.all(
    years.map(async (year) => {
      const url = `https://api-harilibur.vercel.app/api?year=${year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Holiday API failed (${year}): ${response.status}`);
      }

      return response.json();
    })
  );

  const raw = responses.flat();

  const upcoming = raw
    .filter((item) => {
      const d = new Date(item.holiday_date);
      return d >= startDate && d <= endDate && item.is_national_holiday;
    })
    .map((item) => ({ date: item.holiday_date, name: item.holiday_name }));

  return { data: upcoming };
};