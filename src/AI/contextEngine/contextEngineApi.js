import api, { getPlanList } from "@/services/api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const toISODate = (date) => date.toISOString().slice(0, 10);

// =============================================================================
// ACTIVE PLAN WINDOW
// =============================================================================

export const getActivePlanWindow = async () => {
  const res = await getPlanList({ status: "active" });
  // console.log("getPlanList response.data:", JSON.stringify(res.data, null, 2))
  const active = res.data?.data?.[0];

  if (!active) {
    throw new Error(
      "Tidak ada production plan berstatus 'active' saat ini — context engine butuh 1 plan active untuk jalan."
    );
  }

  const startDate = new Date(active.startDate);
  const endDate = new Date(active.endDate);
  const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  return {
    planId: active._id,
    planName: active.name,
    startDate,
    endDate,
    duration,
    tags: active.tags ?? [],
  };
};

// =============================================================================
// ML SALES PREDICTIONS
// Service ML terpisah (repo Python/FastAPI) -- POST /predict-assortment,
// body: { duration, startDate, tags, menus }.
// =============================================================================

export const getSalesPredictions = async (plan) => {
  // Dipanggil lewat backend sendiri (bukan langsung ke service ML di Vercel),
  // supaya dapat baseURL, auth header, dan refresh-token handling dari axios
  // instance yang sudah ada di services/api.js — konsisten dengan endpoint lain.
  const response = await api.post("/predictions/assortment", {
    duration: plan.duration,
    startDate: plan.startDate.toISOString().slice(0, 10), // format YYYY-MM-DD
    tags: plan.tags,
  });

  const raw = response.data?.data ?? [];
  const predictions = raw.map((item) => ({
    menu: item.name,
    quantity: item.recommendedQuantity,
    menuId: item.menuId,
  }));

  return { data: predictions };
};

// =============================================================================
// WEATHER FORECAST
// Open-Meteo -- gratis, tanpa API key. Discope ke rentang tanggal plan.
// Cuma reliable ~16 hari ke depan dari HARI INI (keterbatasan provider).
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

  const isPartialCoverage = rangeEnd < endDate;

  return {
    data: {
      dates: raw.daily?.time ?? [],
      temperature_max: raw.daily?.temperature_2m_max ?? [],
      rain_probability: raw.daily?.precipitation_probability_max ?? [],
      coverage_note: isPartialCoverage
        ? `Weather data only covers ${toISODate(rangeStart)} to ${toISODate(rangeEnd)}. The plan continues until ${toISODate(endDate)}, but no weather forecast is available for the remaining days — that's a data limitation, not an indication of "no weather".`
        : null,
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

  const baseUrl = "https://indonesia-holiday-api-ten.vercel.app";
  if (!baseUrl) {
    throw new Error("VITE_HOLIDAY_API_URL belum diisi di .env — dibutuhkan untuk ambil data hari libur.");
  }

  const responses = await Promise.all(
    years.map(async (year) => {
      const url = `${baseUrl}/api/holidays?year=${year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Holiday API failed (${year}): ${response.status}`);
      }

      const json = await response.json();
      return json.data ?? []; // proxy kamu membungkus jadi { success, data: [...] }
    })
  );

  const raw = responses.flat();

  const upcoming = raw
    .filter((item) => {
      const d = new Date(item.date);
      return d >= startDate && d <= endDate;
    })
    .map((item) => ({ date: item.date, name: item.description }));

  return { data: upcoming };
};