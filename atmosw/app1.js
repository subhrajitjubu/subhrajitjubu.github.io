// ── CONFIG ────────────────────────────────────────────────────
const WEATHER_BASE  = "https://sweatherapi.vercel.app/timeseries";
const AOD_BASE      = "https://sweatherapi.vercel.app/aod";
const AOD_TYPES     = "dust,total,sea,sulfate,pm10,pm25,nitrate";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
let OPENROUTER_API_KEY = null;
// ── STATE ─────────────────────────────────────────────────────

const groq_URL = "https://api.groq.com/openai/v1/chat/completions";
const NVIDIA_URL = "https://nvproxy-three.vercel.app/api/chat/";
let NVIDIA_API_KEY = null;


async function initializeApp() {
    // Try to load OpenRouter key first
    try {
        const openRouterResponse = await fetch("https://opkey.vercel.app/api/get-key");
        if (openRouterResponse.ok) {
            const openRouterData = await openRouterResponse.json();
            if (openRouterData.OPP) {
                window.OPENROUTER_API_KEY = openRouterData.OPP;
                console.log("OpenRouter key loaded");
            }
        }
    } catch (e) {
        console.warn("Failed to load OpenRouter key:", e);
    }
    
    // Try to load Groq key
    try {
        const groqResponse = await fetch("https://opkey.vercel.app/api/groq");
        if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            if (groqData.OPP) {
                window.GROQ_API_KEY = groqData.OPP;
                console.log("Groq key loaded");
            }
        }
    } catch (e) {
        console.warn("Failed to load Groq key:", e);
    }





}


// Run when your app loads
initializeApp();




const GEO_URL       = "https://nominatim.openstreetmap.org/search";

// ── FALLBACK STATIC JSON URLs (GitHub raw — used when live API is down) ──
const FALLBACK = {
  // Weather (global grid: 0.25deg, lat 90→-90, lon 180→179.75, single step)
  temperature: "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/src/2m_temp.json",
  rainfall:    "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/src/rf.json",
  MSLP:        "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/src/msl.json",
  tcwv:        "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/src/tcwv.json",
  // AOD (India region: 0.4deg, lat 50→0, lon 50→100, single valid_time)
  dust:        "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/AOD_DUST.json",
  total:       "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/AOD_TOT.json",
  sea:         "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/AOD_SEA.json",
  sulfate:     "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/AOD_SUL.json",
  nitrate:     "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/AOD_NIT.json",
  DEWpoint:    "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/D2M.json",
   pm10: "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/PM10.json",
    pm25: "https://raw.githubusercontent.com/subhrajitjubu/subhrajitjubu.github.io/main/srcc/PM25.json",
};

// Grid specs
const WEATHER_GRID = { latStart: 40, latEnd: 0,   lonStart: 60,  lonEnd: 100,    res: 0.25, nLon: 161,  nLat: 161 };
const AOD_GRID     = { latStart: 50, latEnd: 0,   lonStart: 50,  lonEnd: 100,    res: 0.4,  nLon: 126,  nLat: 126 };

// Find nearest grid index (handles lon wrap for global grid)
function nearestIdx(val, start, res, n) {
  // lat descends (40→0 or 50→0), so index = (start - val) / res
  let idx = Math.round((start - val) / res);
  return Math.max(0, Math.min(n - 1, idx));
}
function nearestLonIdx(lon, grid) {
  // Weather lon now simple ascending (60→100), no wrap needed
  let idx = Math.round((lon - grid.lonStart) / grid.res);
  return Math.max(0, Math.min(grid.nLon - 1, idx));
}
function nearestAODLatIdx(lat) {
  // AOD lat: 50→0 descending, 0.4deg
  let idx = Math.round((AOD_GRID.latStart - lat) / AOD_GRID.res);
  return Math.max(0, Math.min(AOD_GRID.nLat - 1, idx));
}
function nearestAODLonIdx(lon) {
  let idx = Math.round((lon - AOD_GRID.lonStart) / AOD_GRID.res);
  return Math.max(0, Math.min(AOD_GRID.nLon - 1, idx));
}

// Extract single value at lat/lon from a loaded JSON grid
function extractWeatherValue(jsonData, lat, lon) {
  const latIdx = nearestIdx(lat, WEATHER_GRID.latStart, WEATHER_GRID.res, WEATHER_GRID.nLat);
  const lonIdx = nearestLonIdx(lon, WEATHER_GRID);
  return jsonData.data[0][latIdx][lonIdx];
}
function extractAODValue(jsonData, lat, lon) {
  const latIdx = nearestAODLatIdx(lat);
  const lonIdx = nearestAODLonIdx(lon);
  return jsonData.data[0][latIdx][lonIdx];
}



async function fetchFallbackAOD(lat, lon) {
  const keys = ["dust","total","sea","sulfate","nitrate"];
  const results = {};
  await Promise.all(keys.map(async key => {
    try {
      const resp = await fetchWithTimeout(FALLBACK[key], 20000);
      const json = await resp.json();
      results[key] = extractAODValue(json, lat, lon);
    } catch(e) { results[key] = null; }
  }));
  // pm10 and pm25 not available in fallback — mark as unavailable
  //results.pm10 = null;
  //results.pm25 = null;
  return results;
}

// Build context string from fallback data (single snapshot, no timeseries)
function buildFallbackWeatherContext(vals, lat, lon) {
  const tempC = vals.temperature != null ? (vals.temperature - 273.15).toFixed(1) : "N/A";
  return `
WEATHER DATA (Fallback static snapshot — live API was unavailable):
Coordinates: lat=${lat}, lon=${lon}
Temperature: ${vals.temperature != null ? vals.temperature.toFixed(2) + " K" : "N/A"} → ${tempC}°C
Dew Point: ${vals.DEWpoint != null ? vals.DEWpoint.toFixed(2) + "°C" : "N/A"}
MSLP: ${vals.MSLP != null ? vals.MSLP.toFixed(2) + " hPa" : "N/A"}
Rainfall: ${vals.rainfall != null ? vals.rainfall.toFixed(2) + " mm" : "N/A"}
TCWV: ${vals.tcwv != null ? vals.tcwv.toFixed(2) + " kg/m²" : "N/A"}
Note: This is a static grid snapshot. No timeseries available in fallback mode.
`.trim();
}

function buildFallbackAODContext(vals, lat, lon) {
  const fmt = (v, unit) => v != null ? `${v.toFixed(4)} ${unit}` : "N/A (not in fallback)";
  return `
AOD / AIR QUALITY DATA (Fallback static snapshot — live API was unavailable):
Coordinates: lat=${lat}, lon=${lon}
  dust    : ${fmt(vals.dust,    "AOD")}
  total   : ${fmt(vals.total,   "AOD")}
  sea     : ${fmt(vals.sea,     "AOD")}
  sulfate : ${fmt(vals.sulfate, "AOD")}
  nitrate : ${fmt(vals.nitrate, "AOD")}
  pm10    : ${fmt(vals.pm10,    "µg/m³")}
  pm25    : ${fmt(vals.pm25,    "µg/m³")}
Note: Fallback data is a static grid snapshot. pm10/pm25 not available in fallback.
`.trim();
}



// ── GRID HELPERS ──────────────────────────────────────────────
// Get nearest index along one axis given first value, step, and count
function nearestIdx(target, first, step, n) {
  const idx = Math.round((target - first) / step);
  return Math.max(0, Math.min(n - 1, idx));
}

// Extract nearest grid point value at step=0 from a 3D [step][lat][lon] JSON
function extractGridValue(json, lat, lon) {
  const a = json.attrs;
  const Nx       = a.GRIB_Nx ?? 1440;
  const Ny       = a.GRIB_Ny ?? 721;
  const latFirst = a.GRIB_latitudeOfFirstGridPointInDegrees  ?? 90.0;
  const lonFirst = a.GRIB_longitudeOfFirstGridPointInDegrees ?? 180.0;
  const dLat     = a.GRIB_jDirectionIncrementInDegrees ?? 0.25;
  const dLon     = a.GRIB_iDirectionIncrementInDegrees ?? 0.25;
  // Latitude scans negatively (90 → -90)
  const latIdx = nearestIdx(lat, latFirst, -dLat, Ny);
  // Normalise lon to same convention as GRIB (handles 0–360 vs -180–180)
  let lonQ = lon < 0 ? lon + 360 : lon;
  let lonF = lonFirst < 0 ? lonFirst + 360 : lonFirst;
  if (lonF > 180 && lonQ < lonF) lonQ += 360;
  const lonIdx = nearestIdx(lonQ, lonF, dLon, Nx);
  return json.data[0][latIdx][lonIdx];
}

// Extract full timeseries [all steps] at nearest grid point
function extractGridTimeseries(json, lat, lon) {
  const a = json.attrs;
  const Nx       = a.GRIB_Nx ?? 1440;
  const Ny       = a.GRIB_Ny ?? 721;
  const latFirst = a.GRIB_latitudeOfFirstGridPointInDegrees  ?? 90.0;
  const lonFirst = a.GRIB_longitudeOfFirstGridPointInDegrees ?? 180.0;
  const dLat     = a.GRIB_jDirectionIncrementInDegrees ?? 0.25;
  const dLon     = a.GRIB_iDirectionIncrementInDegrees ?? 0.25;
  const latIdx = nearestIdx(lat, latFirst, -dLat, Ny);
  let lonQ = lon < 0 ? lon + 360 : lon;
  let lonF = lonFirst < 0 ? lonFirst + 360 : lonFirst;
  if (lonF > 180 && lonQ < lonF) lonQ += 360;
  const lonIdx = nearestIdx(lonQ, lonF, dLon, Nx);
  return json.data.map(step => step[latIdx][lonIdx]);
}

// ── FALLBACK FETCH: build weather + AOD objects from static JSONs ─
async function fetchFallbackWeather(lat, lon) {
  // Fetch all needed weather JSONs in parallel
  const [tempJ, rfJ, mslJ, tcwvJ, d2mJ] = await Promise.all([
    fetchWithTimeout(FALLBACK.temperature, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.rainfall, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.MSLP, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.tcwv, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.DEWpoint, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
  ]);

  const tempSeries = extractGridTimeseries(tempJ, lat, lon);
  const rfSeries   = extractGridTimeseries(rfJ,   lat, lon);
  const mslSeries  = extractGridTimeseries(mslJ,  lat, lon);
  const tcwvSeries = extractGridTimeseries(tcwvJ, lat, lon);
  const d2mSeries  = extractGridTimeseries(d2mJ,  lat, lon);

  // Build timeseries in same shape as live API — use step index as proxy for time
  // Static JSONs have no explicit timestamps; label steps as Step 0, 1, 2...
  const timeseries = tempSeries.map((_, i) => ({
    time:               `step_${i}`,
    temperature:        tempSeries[i],          // K
    rainfall:           rfSeries[i]   ?? 0,
    MSLP:               mslSeries[i]  ?? null,
    "total cloud cover": tcwvSeries[i] ?? null,  // using TCWV as proxy column
    DEWpoint:           d2mSeries[i] != null ? +(d2mSeries[i] - 273.15).toFixed(2) : null,
  }));

  return { latitude: lat, longitude: lon, timeseries, _fallback: true };
}

async function fetchFallbackAOD(lat, lon) {
  const [dustJ, totJ, seaJ, sulJ, nitJ] = await Promise.all([
    fetchWithTimeout(FALLBACK.dust, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.total, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.sea, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.sulfate, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
    fetchWithTimeout(FALLBACK.nitrate, 20000).then(r => {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }),
  ]);

  function toSeries(json) {
    return extractGridTimeseries(json, lat, lon).map((v, i) => ({ time: `step_${i}`, forecast: v ?? 0 }));
  }

  return {
    latitude: lat, longitude: lon, _fallback: true,
    timeseries: {
      dust:    toSeries(dustJ),
      total:   toSeries(totJ),
      sea:     toSeries(seaJ),
      sulfate: toSeries(sulJ),
      nitrate: toSeries(nitJ),
      pm10:    [],   // not available in static files
      pm25:    [],   // not available in static files
    }
  };
}

// Plot-trigger keywords
const PLOT_KEYWORDS = /\b(plot|chart|graph|visuali[sz]e|show\s+(me\s+)?(a\s+)?(plot|chart|graph)|draw)\b/i;

// All plottable weather variables
const WEATHER_VARS = {
  temperature:   { label: "Temperature (°C)",    color: "#f0a24a", unit: "°C",    convert: v => +(v - 273.15).toFixed(2) },
  rainfall:      { label: "Rainfall (mm)",        color: "#4ab8f0", unit: "mm",    convert: v => v },
  MSLP:          { label: "MSLP (hPa)",           color: "#c084fc", unit: "hPa",   convert: v => v },
  "total cloud cover": { label: "Cloud Cover (%)", color: "#94a3b8", unit: "%",    convert: v => v },
  DEWpoint:      { label: "Dew Point (°C)",       color: "#4af0c8", unit: "°C",    convert: v => v },
};

// AOD variables
const AOD_VARS = {
  temperature: false, // not in AOD
  dust:     { label: "Dust AOD",         color: "#f0b24a", unit: "AOD" },
  total:    { label: "Total AOD",        color: "#4af0c8", unit: "AOD" },
  sea:      { label: "Sea Salt AOD",     color: "#4ab8f0", unit: "AOD" },
  sulfate:  { label: "Sulfate AOD",      color: "#f07070", unit: "AOD" },
  pm10:     { label: "PM10 (µg/m³)",     color: "#f0d44a", unit: "µg/m³" },
  pm25:     { label: "PM2.5 (µg/m³)",    color: "#ff8c69", unit: "µg/m³" },
  nitrate:  { label: "Nitrate AOD",      color: "#a78bfa", unit: "AOD" },
};

// ── STATE ─────────────────────────────────────────────────────
let conversationHistory = [];
// Cache last fetched raw data per location for re-plotting
let lastWeatherData = null;
let lastAODData = null;
let chartInstances = [];   // track Chart.js instances for destroy

// ── DOM ───────────────────────────────────────────────────────
const chatWrap   = document.getElementById("chatWrap");
const messagesEl = document.getElementById("messages");
const welcomeEl  = document.getElementById("welcomeScreen");
const userInput  = document.getElementById("userInput");
const sendBtn    = document.getElementById("sendBtn");
const keyBtn     = document.getElementById("keyBtn");
const keyModal   = document.getElementById("keyModal");
const cancelKey  = document.getElementById("cancelKey");

// ── KEY MODAL ─────────────────────────────────────────────────
keyBtn.addEventListener("click", () => keyModal.classList.add("open"));
cancelKey.addEventListener("click", () => keyModal.classList.remove("open"));
keyModal.addEventListener("click", e => { if (e.target === keyModal) keyModal.classList.remove("open"); });

// ── SAMPLE QUERIES ────────────────────────────────────────────
document.querySelectorAll(".sample-btn").forEach(btn => {
  btn.addEventListener("click", () => { userInput.value = btn.dataset.q; handleSend(); });
});

// ── INPUT AUTO-RESIZE ─────────────────────────────────────────
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
});
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
sendBtn.addEventListener("click", handleSend);

// ── UNIT CONVERSIONS ──────────────────────────────────────────
const kelvinToCelsius = k => (k - 273.15).toFixed(1);
const gmtToIST = isoStr => {
  const d = new Date(isoStr + "Z");
  const ist = new Date(d.getTime() + 5.5 * 3600000);
  return ist.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC"
  }) + " IST";
};
// Short label for chart x-axis: "24 Mar 08:30"
const gmtToISTShort = isoStr => {
  const d = new Date(isoStr + "Z");
  const ist = new Date(d.getTime() + 5.5 * 3600000);
  const day = ist.getUTCDate().toString().padStart(2,"0");
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][ist.getUTCMonth()];
  const hh  = ist.getUTCHours().toString().padStart(2,"0");
  const mm  = ist.getUTCMinutes().toString().padStart(2,"0");
  return `${day} ${mon} ${hh}:${mm}`;
};

// ── GEOCODING ─────────────────────────────────────────────────
async function geocode(locationName) {
  const url = `${GEO_URL}?q=${encodeURIComponent(locationName + ", India")}&format=json&limit=1&countrycodes=in`;
  const resp = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await resp.json();
  if (!data || data.length === 0) throw new Error(`Location "${locationName}" not found in India.`);
  const { lat, lon, display_name } = data[0];
  return { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
}

// ── FETCH WITH TIMEOUT ────────────────────────────────────────
async function fetchWithTimeout(url, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer); return resp;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("API timed out after " + (timeoutMs/1000) + "s — please try again.");
    throw err;
  }
}

async function fetchWeather(lat, lon) {
  try {
    const url = `${WEATHER_BASE}?lat=${lat}&lon=${lon}`;
    const resp = await fetchWithTimeout(url, 45000);
    if (!resp.ok) throw new Error("status " + resp.status);
    const data = await resp.json();
    data._fallback = false;
    return data;
  } catch (e) {
    console.warn("Live weather API failed (" + e.message + ") — switching to static fallback.");
    return await fetchFallbackWeather(lat, lon);

    // const data = await fetchFallbackWeather(lat, lon);
    // return data;
  }
}

async function fetchAOD(lat, lon) {
  try {
    const url = `${AOD_BASE}?lat=${lat}&lon=${lon}&aod_types=${encodeURIComponent(AOD_TYPES)}`;
    const resp = await fetchWithTimeout(url, 45000);
    if (!resp.ok) throw new Error("status " + resp.status);
    const data = await resp.json();
    data._fallback = false;
    return data;
  } catch (e) {
    console.warn("Live AOD API failed (" + e.message + ") — switching to static fallback.");
    const data = await fetchFallbackAOD(lat, lon);
    return data;
  }
}

// ── CURRENT SLOT HELPERS ──────────────────────────────────────
function isFallbackTime(t) { return typeof t === "string" && t.startsWith("step_"); }

function getCurrentSlot(timeseries) {
  // Fallback data has no real timestamps — return step_0 (most recent available)
  if (!timeseries.length) return null;
  if (isFallbackTime(timeseries[0].time)) return timeseries[0];
  const now = Date.now();
  return timeseries.reduce((best, s) => {
    const d = Math.abs(new Date(s.time + "Z").getTime() - now);
    return d < Math.abs(new Date(best.time + "Z").getTime() - now) ? s : best;
  }, timeseries[0]);
}
function getCurrentAODSlot(aodTimeseries) {
  const now = Date.now();
  const result = {};
  for (const [type, series] of Object.entries(aodTimeseries)) {
    result[type] = series.reduce((best, s) => {
      const d = Math.abs(new Date(s.time + "Z").getTime() - now);
      return d < Math.abs(new Date(best.time + "Z").getTime() - now) ? s : best;
    }, series[0]);
  }
  return result;
}

// ── CONTEXT BUILDERS (for LLM) ────────────────────────────────
function buildWeatherContext(weatherData, slot) {
  const isFB = weatherData._fallback;
  const timeStr = isFB ? "Static fallback (GitHub) — no timestamp available" : gmtToIST(slot.time);
  return `
WEATHER DATA (${isFB ? "⚠ STATIC FALLBACK — live API was unavailable" : "Live from API"}):
Location Coordinates: lat=${weatherData.latitude}, lon=${weatherData.longitude}
Closest timestamp: ${timeStr}
Temperature: ${slot.temperature} K → ${kelvinToCelsius(slot.temperature)}°C
Dew Point: ${slot.DEWpoint}°C
MSLP: ${slot.MSLP} hPa
Rainfall (accumulated): ${slot.rainfall} mm
Total Cloud Cover: ${slot["total cloud cover"]}%

FORECAST SUMMARY (next entries):
${weatherData.timeseries.slice(0, 8).map((s, i) => {
  const t = isFallbackTime(s.time) ? ("Step " + i) : gmtToIST(s.time);
  return "  " + t + ": Temp=" + kelvinToCelsius(s.temperature) + "°C, Rain=" + s.rainfall + "mm, Cloud=" + s["total cloud cover"] + "%, MSLP=" + s.MSLP + "hPa";
}).join("\n")}
`.trim();
}

function buildAODContext(aodData, currentSlots) {
  const lines = Object.entries(currentSlots).map(([type, slot]) => {
    if (!slot) return `  ${type.padEnd(10)}: N/A`;
    const t = isFallbackTime(slot.time) ? "static" : gmtToIST(slot.time);
    return `  ${type.padEnd(10)}: ${slot.forecast} (at ${t})`;
  });
  const isFB = !!(currentSlots.dust && isFallbackTime(currentSlots.dust.time));
  return `
AOD / AIR QUALITY DATA (${isFB ? "⚠ STATIC FALLBACK — live API was unavailable" : "Live from API"}):
Location Coordinates: lat=${aodData.latitude}, lon=${aodData.longitude}
All AOD types at current time (IST):
${lines.join("\n")}

Notes on units:
- dust, total, sea, sulfate, nitrate are Aerosol Optical Depth (dimensionless)
- pm10 is surface PM10 concentration (µg/m³)
- pm25 is surface PM2.5 concentration (µg/m³)
`.trim();
}

// ── PLOT VARIABLE DETECTION ───────────────────────────────────
// Detects which variables the user wants to plot from query text
function detectPlotVariables(query) {
  const q = query.toLowerCase();
  const weatherVarKeys  = Object.keys(WEATHER_VARS);
  const aodVarKeys      = Object.keys(AOD_VARS);
  const requested = { weather: [], aod: [] };

  // Explicit keyword matches
  if (/\btemp(erature)?\b/.test(q))                         requested.weather.push("temperature");
  if (/\brain(fall)?\b/.test(q))                             requested.weather.push("rainfall");
  if (/\b(mslp|pressure|mean sea level)\b/.test(q))         requested.weather.push("MSLP");
  if (/\b(cloud|cloud\s*cover)\b/.test(q))                   requested.weather.push("total cloud cover");
  if (/\bdew(\s*point)?\b/.test(q))                          requested.weather.push("DEWpoint");
  if (/\bdust\b/.test(q))                                    requested.aod.push("dust");
  if (/\b(total\s*aod|total)\b/.test(q))                     requested.aod.push("total");
  if (/\b(sea\s*(salt)?|sea)\b/.test(q))                     requested.aod.push("sea");
  if (/\b(sulfate|sulphate)\b/.test(q))                      requested.aod.push("sulfate");
  if (/\bpm\s*10\b/.test(q))                                 requested.aod.push("pm10");
  if (/\bpm\s*2\.?5\b/.test(q))                              requested.aod.push("pm25");
  if (/\bnitrate\b/.test(q))                                 requested.aod.push("nitrate");

  // "all weather" or "all variables"
  if (/\ball\s*(weather\s*)?(var(iable)?s?)?\b/.test(q) && !/\baod\b|\bair\b|\bpoll/.test(q)) {
    requested.weather = weatherVarKeys;
  }
  // "all aod" or "all air quality"
  if (/\ball\s*(aod|air|poll(ution)?)\b/.test(q) || (/\ball\b/.test(q) && /\baod\b|\bair\b|\bpoll/.test(q))) {
    requested.aod = aodVarKeys;
  }
  // "all" with no specifics — plot everything
  if (/\ball\b/.test(q) && requested.weather.length === 0 && requested.aod.length === 0) {
    requested.weather = weatherVarKeys;
    requested.aod     = aodVarKeys;
  }
  // Default fallback: if plot keyword found but nothing specific → temperature
  if (requested.weather.length === 0 && requested.aod.length === 0) {
    requested.weather = ["temperature"];
  }

  return requested;
}

function normalizeIntent(value) {
  const intent = typeof value === "string" ? value.toLowerCase().trim() : "";
  return ["weather", "aod", "both", "offtopic"].includes(intent) ? intent : null;
}

let lastQueryType = null;


function detectIntentFallback(query) {
    const q = query.toLowerCase();

     // ✅ ADD: Travel and planning patterns that imply weather intent
        const travelPatterns = /\b(plan(ni?ng|ned)?\s+to\s+(go|visit|travel)\s+(to|for)|trip|viable|suitable|good\s+time\s+to\s+visit|should\s+i\s+(go|visit)|is\s+it\s+(okay|good|safe|viable)|what('?s| is)\s+the\s+best\s+time|go\s+(to|for)\s+[a-z])\b/i;    if (travelPatterns.test(q)) {
        console.log("Travel/planning intent detected → weather");
        return "both";
    }
    
    
    // ✅ Check for follow-up patterns that imply same topic as before
    if (/^(how|what)\s+about\b/i.test(q) || /^(and|also)\b/i.test(q)) {
        console.log("Follow-up detected, using last query type:", lastQueryType);
        if (lastQueryType) return lastQueryType;
    }
    
    const hasWeather = /\b(temp(erature)?|rain(fall)?|mslp|pressure|mean sea level|cloud|dew(\s*point)?|forecast|sunny|hot|cold|humid)\b/.test(q);
    const hasAOD = /\b(aod|air quality|poll(ution)?|dust|pm\s*10|pm\s*2\.?5|particulate|sulfate|sulphate|nitrate|sea salt|pm2\.5)\b/.test(q);
    
    let intent;
    if (hasWeather && hasAOD) intent = "both";
    else if (hasAOD) intent = "aod";
    else if (hasWeather) intent = "weather";
    else intent = "offtopic";
    
    // ✅ Store for next follow-up
    if (intent !== "offtopic") {
        lastQueryType = intent;
    }
    
    return intent;
}

function sanitizeLocationCandidate(value) {
    if (typeof value !== "string") return null;
    
    // Remove common filler words that might be captured with location
    const fillerWords = /\b(?:the|next|coming|for|in|at|to|of|is|are|will|would|could|can|please|show|tell|give|me|right|now|today|tomorrow|hours|hour|days|day)\b/gi;
    
    let location = value
        .replace(/^[\s"'`]+|[\s"'`]+$/g, "")  // Trim quotes and spaces
        .replace(/[?!.,;:]+$/g, "")            // Remove trailing punctuation
        .replace(fillerWords, "")              // Remove filler words
        .replace(/\s+/g, " ")                  // Normalize spaces
        .trim();
    
    console.log("Sanitized location:", location);
    return location.length >= 2 ? location : null;
}

function extractLocationFallback(query) {
    if (!query || typeof query !== 'string') return null;
    
    // Work with a lowercase copy for matching
    let text = query.toLowerCase().trim();
    
    // Remove punctuation and special characters
    text = text.replace(/[?!.,;:'"()\[\]{}]/g, ' ');
    
    // ── COMPREHENSIVE STOP PATTERNS ──
    // Order matters: multi-word phrases FIRST, then single words
    const stopPatterns = [
        // Multi-word phrases (must come before single words)
        /\bhow\s+about\b/g, /\bwhat\s+about\b/g,
        /\bhow\s+is\b/g, /\bwhat\s+is\b/g, /\bhow\s+was\b/g,
        /\bwhat\s+was\b/g, /\bright\s+now\b/g,
        /\bair\s+quality\b/g, /\bcloud\s+cover\b/g,
        /\bsea\s+salt\b/g, /\bdew\s*point\b/g,
        /\btime\s+series\b/g, /\btotal\s+cloud\b/g,
        /\bnext\s+\d+\s+\w+\b/g,  // "next 12 hour", "next 3 days"
        /\bfor\s+the\s+next\b/g,
        /\bin\s+the\s+next\b/g,
        
        // Weather / AOD keywords
        /\bweather\b/g, /\bforecast\b/g, /\btemperature\b/g, /\btemp\b/g,
        /\baod\b/g, /\bair\b/g, /\bpollution\b/g, /\bquality\b/g,
        /\bdust\b/g, /\brain\b/g, /\brainfall\b/g, /\bhumidity\b/g,
        /\bwind\b/g, /\bpressure\b/g, /\bmslp\b/g, /\bcloud\b/g,
        /\bpm\s*10\b/g, /\bpm\s*2\.?5\b/g, /\bsulfate\b/g, /\bsulphate\b/g,
        /\bnitrate\b/g, /\bsea\b/g, /\bdew\b/g, /\btotal\b/g,
        /\bheat\b/g, /\bcold\b/g, /\bhot\b/g, /\bhumid\b/g,
        /\bsunny\b/g, /\bcloudy\b/g, /\bstorm\b/g, /\bcyclone\b/g,
        /\bmonsoon\b/g, /\bseason\b/g, /\bclimate\b/g,
        
        // Action / plot keywords
        /\bplot\b/g, /\bchart\b/g, /\bgraph\b/g, /\bshow\b/g,
        /\bdraw\b/g, /\bvisuali[sz]e\b/g, /\bdisplay\b/g,
        /\bcompare\b/g, /\bvs\b/g, /\bversus\b/g,
        
        // Time expressions
        /\btoday\b/g, /\btomorrow\b/g, /\byesterday\b/g,
        /\bnow\b/g, /\bcurrently\b/g, /\bcurrent\b/g,
        /\bnext\b/g, /\bthis\b/g, /\bthat\b/g,
        /\bmorning\b/g, /\bevening\b/g, /\bnight\b/g,
        /\bweek\b/g, /\bday\b/g, /\bdays\b/g,
        /\bhour\b/g, /\bhours\b/g, /\bhr\b/g, /\bhrs\b/g,
        /\bminute\b/g, /\bminutes\b/g, /\bmin\b/g,
        /\bsecond\b/g, /\bseconds\b/g, /\bsec\b/g,
        /\bforecast\s+for\b/g,
        
        // Question / filler words
        /\bwhat\b/g, /\bhow\b/g, /\bwhen\b/g, /\bwhere\b/g,
        /\bwhy\b/g, /\bwhich\b/g, /\bwho\b/g,
        /\bis\b/g, /\bare\b/g, /\bwas\b/g, /\bwere\b/g,
        /\bwill\b/g, /\bshall\b/g, /\bcan\b/g, /\bcould\b/g,
        /\bwould\b/g, /\bshould\b/g, /\bmay\b/g, /\bmight\b/g,
        /\bdo\b/g, /\bdoes\b/g, /\bdid\b/g,
        /\btell\b/g, /\bme\b/g, /\babout\b/g, /\bplease\b/g,
        /\bgive\b/g, /\bget\b/g, /\bfind\b/g, /\bcheck\b/g,
        /\bshow\s+me\b/g, /\blet\s+me\b/g, /\bknow\b/g,
        /\bneed\b/g, /\bwant\b/g, /\blike\b/g, /\bgoing\b/g,
        /\bexpect\b/g, /\bexpected\b/g, /\blikely\b/g,
        /\bchance\b/g, /\bchances\b/g, /\bpredict\b/g, /\bprediction\b/g,
        
         // 🚨 Travel / Implicit weather words
        /\bplan\b/g, /\bplanning\b/g, /\bgo\b/g, /\bgoing\b/g,
        /\bvisit\b/g, /\bvisiting\b/g, /\btrip\b/g, /\btravel\b/g,
        /\btrek\b/g, /\boutdoor\b/g, /\boutdoors\b/g, /\bpicnic\b/g,
        /\bviable\b/g, /\bsafe\b/g, /\bsuitable\b/g, /\bworth\b/g,
        
        // Common English words
        /\bthe\b/g, /\ba\b/g, /\ban\b/g, /\bof\b/g,
        /\bfor\b/g, /\bin\b/g, /\bat\b/g, /\bnear\b/g,
        /\baround\b/g, /\band\b/g, /\balso\b/g, /\bwith\b/g,
        /\bto\b/g, /\bfrom\b/g, /\bthere\b/g, /\bhere\b/g,
        /\bit\b/g, /\bits\b/g, /\bif\b/g, /\bany\b/g,
        /\bsome\b/g, /\bmore\b/g, /\bless\b/g, /\bvery\b/g,
        /\bmuch\b/g, /\bmany\b/g, /\bthan\b/g, /\bthen\b/g,
        /\bheavily\b/g, /\bheavy\b/g, /\blight\b/g, /\bmoderate\b/g,
        /\bextreme\b/g, /\bsevere\b/g, /\bcondition\b/g, /\bconditions\b/g,
        /\breport\b/g, /\bupdate\b/g, /\bstatus\b/g,
        /\bkindly\b/g, /\bregion\b/g, /\barea\b/g, /\bplace\b/g,
        /\bcity\b/g, /\bdistrict\b/g, /\bstate\b/g, /\bcountry\b/g,
        /\bindia\b/g, /\bindian\b/g,

         // "planning to go to X", "planning to visit X", "planned to go for X"
    /\b(?:plan(?:ni?ng|ned)?\s+to\s+(?:go|visit|travel)\s+(?:to|for)\s+)([a-z][a-z\s.'-]*?)(?=(?:\s+(?:next|this|tomorrow|on|for|is|will|would|can|should)\b|[?.!,]|$))/i,
    
    // "go to X", "visit X", "go for X"
    /\b(?:go|visit|travel)\s+(?:to|for)\s+([a-z][a-z\s.'-]*?)(?=(?:\s+(?:next|this|tomorrow|on|for|is|will|would|can|should)\b|[?.!,]|$))/i,
    
    // "viable to go to X", "viable to go for X"
    /\b(?:viable|okay|good|safe|suitable)\s+to\s+(?:go|visit|travel)\s+(?:to|for)\s+([a-z][a-z\s.'-]*?)(?=(?:\s+(?:next|this|tomorrow|on|for|is|will|would|can|should)\b|[?.!,]|$))/i,
    
    // ✅ NEW: Catch "planned to go for X" directly
    /\b(?:planned|planning|plan)\s+to\s+go\s+(?:to|for)\s+([a-z][a-z\s.'-]*?)(?=(?:\s+(?:next|this|tomorrow|on|is|will|would|can|should)\b|[?.!,]|$))/i,
        
        
        // Numbers (like "12" in "next 12 hour")
        /\b\d+\b/g,
    ];
    
    // Apply all stop patterns
    for (const pattern of stopPatterns) {
        text = text.replace(pattern, ' ');
    }
    
    // Clean up extra spaces
    text = text.replace(/\s+/g, ' ').trim();
    
    // ── VALIDATE RESULT ──
    // If nothing meaningful remains, return null
    if (!text || text.length < 2) return null;
    
    // Must contain at least one letter (not just symbols/numbers)
    if (!/[a-zA-Z]/.test(text)) return null;
    
    // If result is too many words (>4), it's probably not a valid location
    // (Indian place names are typically 1-3 words: "New Delhi", "Andhra Pradesh")
    const words = text.split(' ').filter(w => w.length > 0);
    if (words.length > 4) return null;
    
    return sanitizeLocationCandidate(text);
}







///from one
// function extractLocationFallback(query) {
//     const normalized = query.replace(/\s+/g, " ").trim();
//     console.log("🔍 Extracting location from:", normalized);
    
//     // Common Indian location suffixes to help identify city names
//     const locationSuffixes = /(?:pur|bad|abad|nagar|garh|ganj|palli|halli|ur|oor|ore|ere|aram|gram|gaon|pada|wadi|patnam|patna|patti|kot|kottai|pura|puram|giri|gadh|dwara|dwar|bari|sarai|hat|hatti|mandi|pet|peta|tola|palem|valasa|padu|prolu|konda|guda|gudem|uru|kere|guppe|halli|kuppam|kuppan|cheri|cheruvu|kur|ooru)\b/i;
    
//     // Known Indian city names (add more as needed)
//     const knownCities = /\b(?:mumbai|delhi|kolkata|chennai|bengaluru|bangalore|hyderabad|ahmedabad|pune|jaipur|lucknow|kanpur|nagpur|indore|thane|bhopal|visakhapatnam|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|meerut|rajkot|varanasi|srinagar|aurangabad|dhanbad|amritsar|allahabad|ranchi|jabalpur|gwalior|coimbatore|vijayawada|jodhpur|madurai|raipur|chandigarh|guwahati|solapur|hubli|mysore|tiruchirappalli|bareilly|aligarh|moradabad|gorakhpur|bhilai|jamshedpur|bhagalpur|bokaro|ranchi|siliguri|darjeeling|shimla|dehradun|haridwar|rishikesh|udaipur|ajmer|bikaner|jaisalmer|pushkar|pondicherry|kochi|thiruvananthapuram|kollam|kottayam|kannur|kasaragod|mangalore|udupi|belgaum|gulbarga|warangal|nellore|kurnool|rajahmundry|kakinada|eluru|ongole|tenali|guntur|anantapur|chittoor|tirupati|kadapa|khammam|nizamabad|karimnagar|ramagundam|adilabad|mancherial|nirmal|bhainsa|basar|nizamabad|medak|sangareddy|siddipet|wanaparthy|gadwal|nagarkurnool|mahbubnagar|nalgonda|suryapet|miryalaguda|bhongir|jangaon|hanamkonda|parakala|thorur|mulugu|bhadrachalam|manuguru|yellandu|kothagudem|palvancha|mandamarri|bellampalli|manchiryal|luxettipet|asifabad|jagtial|metpalli|koratla|siricilla|karimnagar|huzurabad|husnabad|warangal|hanamkonda|parakala|mahabubabad|dornakal|kesamudram|narsampet|parkal|bhupalpalle|manthani|peddapalli|godavarikhani|ramagundam|mancherial|bellampalli|mandamarri|adilabad|nirmal|bhainsa|basar|nizamabad|armoor|bodhan|kamareddy|medak|sangareddy|siddipet|zahirabad|bidar|gulbarga|yadgir|raichur|ballari|hospet|kadapa|anantapur|dharwad|hubli|belgaum|udupi)\b/i;
    
//     // Step 1: Try follow-up patterns
//     const followUpPatterns = [
//         /\b(?:how|what)\s+(?:about|for)\s+([a-z][a-z\s.'-]*?)(?=\s*\?*$)/i,
//         /\b(?:and|also)\s+([a-z][a-z\s.'-]*?)(?=\s*\?*$)/i,
//     ];
    
//     for (const pattern of followUpPatterns) {
//         const match = normalized.match(pattern);
//         const candidate = sanitizeLocationCandidate(match?.[1]);
//         if (candidate) {
//             console.log("✅ Found via follow-up pattern:", candidate);
//             return candidate;
//         }
//     }
    
//     // Step 2: Try "Location keyword" pattern (e.g., "Gajadipur forecast")
//     const locationBeforeKeyword = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:weather|forecast|air quality|aod|pollution|temp|temperature|rain|humidity|climate|pm2\.5|pm10|dust)\b/i;
//     const match1 = normalized.match(locationBeforeKeyword);
//     if (match1) {
//         const candidate = sanitizeLocationCandidate(match1[1]);
//         if (candidate) {
//             console.log("✅ Found via 'Location keyword' pattern:", candidate);
//             return candidate;
//         }
//     }
    
//     // Step 3: Try "keyword in Location" pattern (e.g., "weather in Mumbai")
//     const keywordBeforeLocation = /\b(?:weather|forecast|air quality|aod|pollution|temp|temperature|rain|humidity|climate|pm2\.5|pm10|dust)\s+(?:in|at|for|of|near|over)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
//     const match2 = normalized.match(keywordBeforeLocation);
//     if (match2) {
//         const candidate = sanitizeLocationCandidate(match2[1]);
//         if (candidate) {
//             console.log("✅ Found via 'keyword in Location' pattern:", candidate);
//             return candidate;
//         }
//     }
    
//     // Step 4: Try preposition patterns (e.g., "in Mumbai", "at Delhi")
//     const prepositionPattern = /\b(?:in|at|for|near|around|over)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
//     const match3 = normalized.match(prepositionPattern);
//     if (match3) {
//         const candidate = sanitizeLocationCandidate(match3[1]);
//         if (candidate) {
//             console.log("✅ Found via preposition pattern:", candidate);
//             return candidate;
//         }
//     }
    
//     // Step 5: Check against known cities
//     const knownCityMatch = normalized.match(knownCities);
//     if (knownCityMatch) {
//         const candidate = knownCityMatch[0];
//         console.log("✅ Found via known cities list:", candidate);
//         return candidate;
//     }
    
//     // Step 6: Look for words that look like Indian place names
//     const words = normalized.split(/\s+/);
//     for (const word of words) {
//         // Check if word has location-like suffix or starts with capital letter
//         if (word.length > 3 && 
//             (locationSuffixes.test(word) || /^[A-Z][a-z]+$/.test(word)) &&
//             !/^(?:what|how|when|where|why|who|which|weather|forecast|temperature|rain|humidity|show|tell|give|please|can|could|would|will|is|are|the|for|in|at|to|of|next|hours|hour|days|day|right|now|today|tomorrow)$/i.test(word)) {
//             console.log("✅ Found via location suffix/capital pattern:", word);
//             return word;
//         }
//     }
    
//     // Step 7: Just take the first word if it starts with capital and looks like a name
//     const firstWordMatch = normalized.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
//     if (firstWordMatch && !/^(?:what|how|when|where|why|who|which|weather|forecast|show|tell|please)$/i.test(firstWordMatch[1])) {
//         const candidate = sanitizeLocationCandidate(firstWordMatch[1]);
//         if (candidate && candidate.length > 2) {
//             console.log("✅ Found via first capitalized word:", candidate);
//             return candidate;
//         }
//     }
    
//     console.log("❌ No location found");
//     return null;
// }

//???????????

// function extractLocationFallback(query) {
//     const normalized = query.replace(/\s+/g, " ").trim();
    
//     // ✅ ADD: Pattern for follow-up questions like "how about X", "what about X"
//     const followUpPatterns = [
//         /\b(?:how|what)\s+(?:about|for)\s+([a-z][a-z\s.'-]*?)(?=\s*\?*$)/i,
//         /\b(?:and|also)\s+([a-z][a-z\s.'-]*?)(?=\s*\?*$)/i,
//     ];
    
//     for (const pattern of followUpPatterns) {
//         const match = normalized.match(pattern);
//         const candidate = sanitizeLocationCandidate(match?.[1]);
//         if (candidate) {
//             console.log("Found location from follow-up pattern:", candidate);
//             return candidate;
//         }
//     }
    
//     // Existing patterns
//     const patterns = [
//         /\b(?:in|at|for|near|around)\s+([a-z][a-z\s.'-]*?)(?=(?:\s+\b(?:right now|now|today|tomorrow|currently|this|next|please|give|show|plot|chart|graph|draw)\b|[?.!,]|$))/i,
//         /\b(?:weather|forecast|air quality|aod|pollution)\s+(?:in|for)\s+([a-z][a-z\s.'-]*?)(?=(?:\s+\b(?:right now|now|today|tomorrow|currently|this|next)\b|[?.!,]|$))/i,
//     ];

//     for (const pattern of patterns) {
//         const match = normalized.match(pattern);
//         const candidate = sanitizeLocationCandidate(match?.[1]);
//         if (candidate) return candidate;
//     }

//     // ✅ ADD: If query is just a location name (like "Mumbai?" or "Delhi?")
//     const simpleLocationPattern = /^([a-z][a-z\s.'-]*?)\s*\?*$/i;
//     const simpleMatch = normalized.match(simpleLocationPattern);
//     const simpleCandidate = sanitizeLocationCandidate(simpleMatch?.[1]);
//     if (simpleCandidate && simpleCandidate.length > 2) {
//         console.log("Found location from simple pattern:", simpleCandidate);
//         return simpleCandidate;
//     }

//     return null;
// }

// ── CHAT WITH TRIPLE FALLBACK ──────────────────────────────────
async function chatWithFallback(messages) {
    // Try 1: OpenRouter
    if (window.OPENROUTER_API_KEY) {
        try {
            console.log("Attempting with OpenRouter...");
            const response = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "AtmosAware"
                },
                body: JSON.stringify({
                    model: "openrouter/free", 
                    messages: messages,
                    reasoning: {
                        enabled: true
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    console.log("✅ OpenRouter succeeded");
                    return data;
                }
            }
            console.warn("OpenRouter failed with status:", response.status);
        } catch (e) {
            console.warn("OpenRouter error:", e.message);
        }
    }

    // Try 2: Groq
    if (window.GROQ_API_KEY) {
        try {
            console.log("Falling back to Groq...");
            const response = await fetch(groq_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "compound-mini",
                    content: messages,
                    
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    console.log("✅ Groq succeeded");
                    return data;
                }
            }
            console.warn("Groq failed with status:", response.status);
        } catch (e) {
            console.warn("Groq error:", e.message);
        }
    }

    // ✅ ADD: Try 3: NVIDIA NIM API
    if (window.NVIDIA_API_KEY) {
        try {
            console.log("Falling back to NVIDIA NIM...");
            const response = await fetch(NVIDIA_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages: messages,
                    temperature: 1,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    max_tokens: 4096,
                    stream: true,
                    reasoning_effort: "medium"
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    console.log("✅ NVIDIA NIM succeeded");
                    return data;
                }
            }
            console.warn("NVIDIA NIM failed with status:", response.status);
        } catch (e) {
            console.warn("NVIDIA NIM error:", e.message);
        }
    }

    // All providers failed
    throw new Error("All API providers failed (OpenRouter, Groq, NVIDIA). Please check your configuration.");
}

// Keep the wrapper function
async function chat(messages) {
    return await chatWithFallback(messages);
}





// ── CHART RENDERING ───────────────────────────────────────────
const CHART_COLORS = [
  "#4af0c8","#f0a24a","#4ab8f0","#f07070","#c084fc",
  "#f0d44a","#ff8c69","#94a3b8","#a78bfa","#86efac"
];

function renderCharts(msgDiv, location, weatherData, aodData, vars) {
  const container = msgDiv.querySelector(".chart-area");
  if (!container) return;

  const chartsToRender = [];

  // Weather charts
  if (vars.weather && vars.weather.length > 0 && weatherData) {
    const labels = weatherData.timeseries.map((s, i) => isFallbackTime(s.time) ? ("Step " + i) : gmtToISTShort(s.time));
    vars.weather.forEach((varKey, i) => {
      const meta = WEATHER_VARS[varKey];
      if (!meta) return;
      const values = weatherData.timeseries.map(s => meta.convert(s[varKey] ?? s[varKey]));
      chartsToRender.push({ labels, datasets:[{
        label: meta.label,
        data: values,
        borderColor: meta.color,
        backgroundColor: meta.color + "22",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.35
      }], title: `${meta.label} — ${location}`, unit: meta.unit });
    });
  }

  // AOD charts
  if (vars.aod && vars.aod.length > 0 && aodData) {
    // Group all AOD vars on one chart if multiple, else separate
    if (vars.aod.length > 1) {
      const firstType = vars.aod[0];
      const labels = (aodData.timeseries[firstType] || []).map((s, i) => isFallbackTime(s.time) ? ("Step " + i) : gmtToISTShort(s.time));
      const datasets = vars.aod.map((type, i) => {
        const meta = AOD_VARS[type];
        if (!meta || !aodData.timeseries[type]) return null;
        return {
          label: meta.label,
          data: aodData.timeseries[type].map(s => s.forecast),
          borderColor: CHART_COLORS[i % CHART_COLORS.length],
          backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + "18",
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          fill: false,
          tension: 0.35
        };
      }).filter(Boolean);
      chartsToRender.push({ labels, datasets, title: `Air Quality (AOD) — ${location}`, unit: "mixed" });
    } else {
      const type = vars.aod[0];
      const meta = AOD_VARS[type];
      if (meta && aodData.timeseries[type]) {
        const labels = aodData.timeseries[type].map((s, i) => isFallbackTime(s.time) ? ("Step " + i) : gmtToISTShort(s.time));
        const values = aodData.timeseries[type].map(s => s.forecast);
        chartsToRender.push({ labels, datasets:[{
          label: meta.label,
          data: values,
          borderColor: meta.color,
          backgroundColor: meta.color + "22",
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35
        }], title: `${meta.label} — ${location}`, unit: meta.unit });
      }
    }
  }

  // Render each chart
  chartsToRender.forEach(({ labels, datasets, title, unit }) => {
    const wrap = document.createElement("div");
    wrap.className = "chart-wrap";

    const titleEl = document.createElement("div");
    titleEl.className = "chart-title";
    titleEl.textContent = title;
    wrap.appendChild(titleEl);

    const canvas = document.createElement("canvas");
    canvas.height = 220;
    wrap.appendChild(canvas);
    container.appendChild(wrap);

    const chart = new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: datasets.length > 1,
            labels: { color: "#7a8499", font: { family: "'Space Mono', monospace", size: 10 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: "#111318",
            borderColor: "#252c3a",
            borderWidth: 1,
            titleColor: "#4af0c8",
            bodyColor: "#e8edf5",
            titleFont: { family: "'Space Mono', monospace", size: 11 },
            bodyFont:  { family: "'Space Mono', monospace", size: 11 },
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit !== "mixed" ? unit : ""}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#4a5268",
              font: { family: "'Space Mono', monospace", size: 9 },
              maxTicksLimit: 8,
              maxRotation: 30
            },
            grid: { color: "#1e2330" }
          },
          y: {
            ticks: {
              color: "#4a5268",
              font: { family: "'Space Mono', monospace", size: 10 },
            },
            grid: { color: "#1e2330" }
          }
        }
      }
    });
    chartInstances.push(chart);
  });
}

// ── CLASSIFY INTENT ───────────────────────────────────────────



async function classifyIntent(query, previousIntent = null) {
  const prompt = `
Classify the user's query.

Valid intents:
- weather: Questions about temperature, rain, forecasts, humidity, wind.
- aod: Questions about Aerosol Optical Depth, air pollution, AQI, smog, dust.
- both: Travel/planning queries OR questions asking about both weather AND air quality.
- offtopic: Anything unrelated.

IMPORTANT RULES:
1. Travel/planning questions (e.g., "planning to visit X", "is it viable to go to X") → classify as "weather"
2. Questions about outdoor activities, events, trips → classify as "weather"
3. "How about X", "What about X" → carry forward previous intent
4. If a location is mentioned but no specific weather/AQ keywords, default to "weather"
5. Extract the FULL place name including "fort", "beach", "temple" etc.



Extract the city, district, state, or region in India if one is mentioned.
IMPORTANT: Even if the location is a small village, town,fort, beach or obscure place (like Gajadipur), extract it. Do not return null just because you are unsure if it is a major city.
Context: The previous user intent was: ${previousIntent || 'None'}.
IMPORTANT: If the query is a follow-up like "how about Mumbai" or "what about Delhi", 
assume the SAME intent as the previous intent, and extract the new location.

If no location is mentioned, return null.

Examples:
- "planning to go to palashi fort next saturday" → {"intent":"weather","location":"palashi fort"}
- "planning to go to palashi next saturday" → {"intent":"weather","location":"palashi "}
- "is it viable to visit Goa" → {"intent":"weather","location":"Goa"}
- "should i go to Mumbai tomorrow" → {"intent":"weather","location":"Mumbai"}
- "how about mumbai" → {"intent":"aod","location":"Mumbai"}
- "what's the temperature in Delhi" → {"intent":"weather","location":"Delhi"}
- "show me AOD in Kolkata" → {"intent":"aod","location":"Kolkata"}

Return ONLY valid JSON. No markdown.


Query: ${query}
`;

  const data = await chat([
    { role: "system", content: "Return only valid JSON. No markdown." },
    { role: "user", content: prompt }
  ]);

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Classifier returned an empty response.");

  // Safely strip markdown wrappers
  let cleanText = raw;
  if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7);
  else if (cleanText.startsWith("```")) cleanText = cleanText.slice(3);
  if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);
  cleanText = cleanText.trim();

  // Safely extract JSON object (prevents regex greedy matching bugs)
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    throw new Error("Failed to parse classifier JSON");
  }
}



// ── GENERATE RESPONSE ─────────────────────────────────────────

async function generateResponse(query, context, isPlot) {

    const SYSTEM = `
You are Atmosaware, a helpful weather and air quality assistant for India.
CRITICAL - Use these EXACT rainfall categories (IMD standards):
- Very Light Rain: up to 2.4 mm
- Light Rain: 2.5 to 15.5 mm
- Moderate Rain: 15.6 to 64.4 mm
- Heavy Rain: 64.5 to 115.5 mm
- Very Heavy Rain: 115.6 to 204.4 mm
- Extremely Heavy Rain: 204.5 mm or more
- Exceptionally Heavy Rain: Near highest recorded for that station/season, above 240 mm

Rules:
1. Only answer weather and air quality questions about India.
2. Use ONLY the data provided in the context.
3. Keep responses SHORT and SIMPLE - use plain language, not technical terms.
4. Round numbers to whole values when possible (e.g., "about 25°C" instead of "25.3°C").
5. Use descriptive terms instead of raw numbers (e.g., "light rain", "heavy rain", "clear sky", "hazy").
6. If heavy rain is expected, say so clearly. Heavy rain means more than 5mm in 3 hours or 10mm per day.
7. For AQI/AOD: say "good", "moderate", "poor", or "very poor" air quality instead of exact values.
8. Mention time in simple terms (e.g., "this evening", "tomorrow morning", "next 2 days").
9. Do NOT show raw data tables or long lists of numbers.
10. If asked about future beyond available data, say honestly what you can and cannot predict.

${isPlot ? "A chart is already displayed. Explain the trends." : ""}
`;

    const messages = [
        {
            role: "system",
            content: SYSTEM
        },

        ...conversationHistory,

        {
            role: "user",
            content: `${query}

LIVE DATA:

${context}`
        }
    ];

    const data = await chat(messages);

    const assistantMsg =
        data.choices?.[0]?.message?.content ??
        "No response received.";

    conversationHistory.push({
        role: "user",
        content: query
    });

    conversationHistory.push({
        role: "assistant",
        content: assistantMsg
    });

    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }


    return assistantMsg;
}




// ── RENDER HELPERS ────────────────────────────────────────────
function appendMessage(role, content, isLoading = false, withChartArea = false) {
  if (welcomeEl) welcomeEl.style.display = "none";
  const div = document.createElement("div");
  div.className = `msg ${role}${isLoading ? " loading-msg" : ""}`;
  div.innerHTML = `
    <div class="msg-avatar">${role === "user" ? "◉" : "◈"}</div>
    <div class="msg-body">
      <div class="msg-role">${role === "user" ? "You" : "Atmosaware"}</div>
      <div class="msg-text">${isLoading
        ? `<span class="dots"><span></span><span></span><span></span></span> Fetching live data… <span style="color:var(--text-dim);font-size:11px">(API may take ~10s on first load)</span>`
        : escapeAndFormat(content)
      }</div>
      ${withChartArea ? `<div class="chart-area"></div>` : ""}
    </div>`;
  messagesEl.appendChild(div);
  chatWrap.scrollTop = chatWrap.scrollHeight;
  return div;
}

function updateMessage(div, content, isError = false) {
  const textEl = div.querySelector(".msg-text");
  textEl.className = "msg-text" + (isError ? " error-text" : "");
  textEl.innerHTML = escapeAndFormat(content);
  chatWrap.scrollTop = chatWrap.scrollHeight;
}

function escapeAndFormat(text) {
  return text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/\n/g,"<br>");
}

// ── MAIN HANDLER ──────────────────────────────────────────────

// ── MAIN HANDLER ──────────────────────────────────────────────
async function handleSend() {
  const query = userInput.value.trim();
  if (!query) return;

  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  appendMessage("user", query);

  // Detect if this is a plot request
  const isPlot = PLOT_KEYWORDS.test(query);
  const plotVars = isPlot ? detectPlotVariables(query) : null;

  const loadingDiv = appendMessage("assistant", "", true, isPlot);

  try {
    // Step 1: Classify (Pass lastQueryType for follow-up context!)
    let intent, location;
    let clsIntent = null, clsLocation = null;
    
    try {
      // We pass lastQueryType so the LLM knows what "how about X" refers to
      const cls = await classifyIntent(query, lastQueryType);
      clsIntent = normalizeIntent(cls.intent);
      clsLocation = sanitizeLocationCandidate(cls.location);
      
      console.log("🔍 Classifier result:", {
        query: query,
        classifierIntent: clsIntent,
        classifierLocation: clsLocation
      });
    } catch(e) {
      console.warn("Classifier failed, using regex fallback:", e);
    }

    // Fallback to regex if classifier failed or returned invalid
    intent = clsIntent || detectIntentFallback(query);
    location = clsLocation || extractLocationFallback(query);
    
    console.log("🔍 Final resolved:", { intent, location });

    // Update memory for next turn's follow-ups
    if (intent && intent !== "offtopic") {
        lastQueryType = intent;
    }

    if (intent === "offtopic") {
      updateMessage(loadingDiv, "I'm Atmosaware, a weather and air intelligence assistant for India. Please ask me about weather conditions or air quality in any Indian city or region.");
      return;
    }
    if (!location) {
      updateMessage(loadingDiv, "Could you specify a location in India? For example: \"Plot temperature in Bhubaneswar\".");
      return;
    }

    // Step 2: Geocode
    let geoResult;
    try { 
        geoResult = await geocode(location); 
    } catch(e) { 
        updateMessage(loadingDiv, `❌ ${e.message}`, true); 
        return; 
    }
    const { lat, lon, display_name } = geoResult;

    // Step 3: Decide what to fetch
    let needWeather = intent === "weather" || intent === "both";
    let needAOD     = intent === "aod"     || intent === "both";
    
    // If plotting, force fetch based on plotVars regardless of LLM intent
    if (isPlot) {
      if (plotVars.weather && plotVars.weather.length > 0) needWeather = true;
      if (plotVars.aod && plotVars.aod.length > 0) needAOD = true;
    }

    let context = `Location resolved: ${display_name} (lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)})\n\n`;
    let weatherData = null, aodData = null;
    let usingFallback = { weather: false, aod: false };

    // Fetch Weather 
    // Note: fetchWeather already handles internal fallback if live API fails!
    if (needWeather) {
      try {
        weatherData = await fetchWeather(lat, lon);
        lastWeatherData = weatherData;
        const slot = getCurrentSlot(weatherData.timeseries);
        context += buildWeatherContext(weatherData, slot) + "\n\n";
        
        // Just check the flag instead of trying to fetch again
        if (weatherData._fallback) usingFallback.weather = true;
      } catch(e) {
        // This only triggers if BOTH live and fallback failed inside fetchWeather
        context += `[Weather data completely unavailable: ${e.message}]\n\n`;
      }
    }

    // Fetch AOD
    // Note: fetchAOD already handles internal fallback if live API fails!
    if (needAOD) {
      try {
        aodData = await fetchAOD(lat, lon);
        lastAODData = aodData;
        const currentAOD = getCurrentAODSlot(aodData.timeseries);
        context += buildAODContext(aodData, currentAOD);
        
        if (aodData._fallback) usingFallback.aod = true;
      } catch(e) {
        context += `[AOD data completely unavailable: ${e.message}]\n`;
      }
    }

    // Step 4: Generate text response
    const response = await generateResponse(query, context, isPlot);
    updateMessage(loadingDiv, response);

    // Show a single, clean fallback warning badge if either source was static
    if (usingFallback.weather || usingFallback.aod) {
      const badge = document.createElement("div");
      badge.style.cssText = "margin-top:10px;padding:6px 12px;background:#2a1f0a;border:1px solid #f0b24a44;border-radius:6px;font-size:11px;color:#f0b24a;letter-spacing:0.04em;";
      badge.innerHTML = "⚠ Live API was unavailable — showing static fallback data from GitHub. Timestamps replaced with step indices.";
      loadingDiv.querySelector(".msg-body").appendChild(badge);
    }

    // Step 5: Render charts if requested
    if (isPlot && (weatherData || aodData)) {
      
      // Destroy old charts before rendering new ones to prevent memory leaks!
      chartInstances.forEach(chart => chart.destroy());
      chartInstances = [];

      const shortLocation = display_name.split(",")[0];
      renderCharts(loadingDiv, shortLocation, weatherData, aodData, plotVars);
      chatWrap.scrollTop = chatWrap.scrollHeight;
    }

  } catch(err) {
    console.error("Atmosaware error:", err);
    updateMessage(loadingDiv, `❌ ${err.message || "Unknown error. Check console for details."}`, true);
  } finally {
    sendBtn.disabled = false;
  }
}


// ── INIT ──────────────────────────────────────────────────────
keyBtn.style.borderColor = "var(--accent-dim)";
keyBtn.style.color = "var(--accent)";
// Run your application
