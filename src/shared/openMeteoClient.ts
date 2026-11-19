import {
  assessInversionRisk,
  classifyUsAqi,
  generateSafetyAlerts,
  interpretWeatherCode,
} from './aqiUtils.ts';
import type {
  AirQualitySnapshot,
  HourlyTrendPoint,
  LocationSelection,
  PollutantReadings,
  UserProfile,
  WeatherConditions,
} from './types.ts';

export const CURATED_FALLBACK_LOCATIONS: LocationSelection[] = [
  { name: 'New Delhi', country: 'India', admin1: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { name: 'Lahore', country: 'Pakistan', admin1: 'Punjab', latitude: 31.5204, longitude: 74.3587 },
  { name: 'Salt Lake City', country: 'United States', admin1: 'Utah', latitude: 40.7608, longitude: -111.891 },
  { name: 'Milan', country: 'Italy', admin1: 'Lombardy', latitude: 45.4642, longitude: 9.19 },
  { name: 'Krakow', country: 'Poland', admin1: 'Lesser Poland', latitude: 50.0647, longitude: 19.945 },
  { name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Beijing', country: 'China', admin1: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
  { name: 'Seoul', country: 'South Korea', admin1: 'Seoul', latitude: 37.5665, longitude: 126.978 },
  { name: 'Los Angeles', country: 'United States', admin1: 'California', latitude: 34.0522, longitude: -118.2437 },
  { name: 'Toronto', country: 'Canada', admin1: 'Ontario', latitude: 43.6532, longitude: -79.3832 },
];

export async function searchOpenMeteoLocations(
  query: string,
  fetcher: typeof fetch = fetch
): Promise<{
  results: LocationSelection[];
  source: 'open_meteo_geocoding' | 'offline_directory_fallback';
}> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { results: CURATED_FALLBACK_LOCATIONS.slice(0, 6), source: 'offline_directory_fallback' };
  }

  const cacheKey = trimmed.toLowerCase();
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=8&language=en&format=json`;
    const res = await fetcher(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
    const json = (await res.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    const mapped: LocationSelection[] = (json.results ?? []).map((item) => ({
      name: item.name,
      country: item.country,
      admin1: item.admin1,
      latitude: Number(item.latitude.toFixed(4)),
      longitude: Number(item.longitude.toFixed(4)),
    }));

    return { results: mapped, source: 'open_meteo_geocoding' };
  } catch {
    const localMatches = CURATED_FALLBACK_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(cacheKey) ||
        (loc.country ?? '').toLowerCase().includes(cacheKey)
    );
    return {
      results: localMatches.length > 0 ? localMatches : CURATED_FALLBACK_LOCATIONS.slice(0, 5),
      source: 'offline_directory_fallback',
    };
  }
}

export function buildDailySummaryText(
  cityName: string,
  aqi: number,
  pollutants: PollutantReadings,
  weather: WeatherConditions
): string {
  const band = classifyUsAqi(aqi);
  const pm25Str =
    pollutants.pm25 !== null ? `PM2.5 is ${pollutants.pm25.toFixed(1)} µg/m³` : 'PM2.5 is unavailable';
  const windStr =
    weather.windSpeedKmh !== null ? `wind at ${weather.windSpeedKmh.toFixed(1)} km/h` : 'wind data unavailable';
  return `${cityName} is currently at ${aqi} US AQI (${band.label}). ${pm25Str} with ${windStr} (${weather.weatherSummary.toLowerCase()}). ${band.shortAction}`;
}

export function buildSampleFallbackSnapshot(
  location: LocationSelection,
  profile?: UserProfile
): AirQualitySnapshot {
  const sampleAqi = 178;
  const pollutants: PollutantReadings = {
    pm25: 94.2,
    pm10: 148.6,
    no2: 46.8,
    so2: 14.2,
    co: 920,
    o3: 32.0,
  };
  const weather: WeatherConditions = {
    temperatureC: 9.4,
    humidityPercent: 74,
    windSpeedKmh: 4.2,
    surfacePressureHpa: 1019,
    weatherSummary: 'Winter mist / calm inversion sample',
    inversionRisk: 'high',
  };

  const now = Date.now();
  const hourlyTrend: HourlyTrendPoint[] = Array.from({ length: 24 }, (_, idx) => {
    const hourOffset = 23 - idx;
    const dt = new Date(now - hourOffset * 3600_000);
    const diurnalCurve = Math.round(155 + 32 * Math.sin((idx / 24) * Math.PI * 2));
    return {
      timeIso: dt.toISOString(),
      label: dt.toISOString().slice(5, 16).replace('T', ' '),
      usAqi: diurnalCurve,
      pm25: Number((diurnalCurve * 0.52).toFixed(1)),
      pm10: Number((diurnalCurve * 0.85).toFixed(1)),
    };
  });

  const classification = classifyUsAqi(sampleAqi);
  return {
    location,
    currentAqi: sampleAqi,
    europeanAqi: 84,
    classification,
    pollutants,
    weather,
    hourlyTrend,
    dailySummary:
      'Sample fallback winter smog profile (not live sensor data): illustrates morning inversion buildup (~178 US AQI) for offline planning.',
    alerts: generateSafetyAlerts({
      aqi: sampleAqi,
      pollutants,
      weather,
      hourlyTrend,
      dataStatus: 'sample_fallback',
      profile,
    }),
    dataStatus: 'sample_fallback',
    dataSource: 'Sample Winter Smog Baseline (Live API Unreachable)',
    lastUpdatedIso: new Date().toISOString(),
    notice:
      'Displayed measurements are clearly labeled sample baseline values because live upstream API feeds are currently unreachable.',
  };
}

export async function fetchOpenMeteoSnapshot(params: {
  location: LocationSelection;
  profile?: UserProfile;
  fetcher?: typeof fetch;
}): Promise<AirQualitySnapshot> {
  const { location, profile, fetcher = fetch } = params;

  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
    `&hourly=us_aqi,pm2_5,pm10&past_days=2&forecast_days=1&timezone=auto`;

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code` +
    `&timezone=auto`;

  const [aqRes, weatherRes] = await Promise.all([
    fetcher(aqUrl, { signal: AbortSignal.timeout(6500) }),
    fetcher(weatherUrl, { signal: AbortSignal.timeout(6500) }).catch(() => null),
  ]);

  if (!aqRes.ok) {
    throw new Error(`Open-Meteo Air Quality HTTP ${aqRes.status}`);
  }

  const aqData = (await aqRes.json()) as {
    current?: {
      time?: string;
      us_aqi?: number | null;
      european_aqi?: number | null;
      pm2_5?: number | null;
      pm10?: number | null;
      nitrogen_dioxide?: number | null;
      sulphur_dioxide?: number | null;
      carbon_monoxide?: number | null;
      ozone?: number | null;
    };
    hourly?: {
      time?: string[];
      us_aqi?: Array<number | null>;
      pm2_5?: Array<number | null>;
      pm10?: Array<number | null>;
    };
  };

  let weather: WeatherConditions = {
    temperatureC: null,
    humidityPercent: null,
    windSpeedKmh: null,
    surfacePressureHpa: null,
    weatherSummary: 'Weather telemetry unavailable',
    inversionRisk: 'unknown',
  };

  if (weatherRes && weatherRes.ok) {
    const wJson = (await weatherRes.json()) as {
      current?: {
        temperature_2m?: number | null;
        relative_humidity_2m?: number | null;
        wind_speed_10m?: number | null;
        surface_pressure?: number | null;
        weather_code?: number | null;
      };
    };
    const temp = wJson.current?.temperature_2m ?? null;
    const wind = wJson.current?.wind_speed_10m ?? null;
    weather = {
      temperatureC: temp,
      humidityPercent: wJson.current?.relative_humidity_2m ?? null,
      windSpeedKmh: wind,
      surfacePressureHpa: wJson.current?.surface_pressure ?? null,
      weatherSummary: interpretWeatherCode(wJson.current?.weather_code),
      inversionRisk: assessInversionRisk(wind, temp),
    };
  }

  const currentAqi = Math.round(aqData.current?.us_aqi ?? 75);
  const pollutants: PollutantReadings = {
    pm25: aqData.current?.pm2_5 ?? null,
    pm10: aqData.current?.pm10 ?? null,
    no2: aqData.current?.nitrogen_dioxide ?? null,
    so2: aqData.current?.sulphur_dioxide ?? null,
    co: aqData.current?.carbon_monoxide ?? null,
    o3: aqData.current?.ozone ?? null,
  };

  const times = aqData.hourly?.time ?? [];
  const aqiArr = aqData.hourly?.us_aqi ?? [];
  const pm25Arr = aqData.hourly?.pm2_5 ?? [];
  const pm10Arr = aqData.hourly?.pm10 ?? [];

  const startIndex = Math.max(0, times.length - 48);
  const hourlyTrend: HourlyTrendPoint[] = [];
  for (let i = startIndex; i < times.length; i += 1) {
    const t = times[i];
    hourlyTrend.push({
      timeIso: t,
      label: t.slice(5, 16).replace('T', ' '),
      usAqi: typeof aqiArr[i] === 'number' ? Math.round(aqiArr[i] as number) : null,
      pm25: typeof pm25Arr[i] === 'number' ? Number((pm25Arr[i] as number).toFixed(1)) : null,
      pm10: typeof pm10Arr[i] === 'number' ? Number((pm10Arr[i] as number).toFixed(1)) : null,
    });
  }

  const classification = classifyUsAqi(currentAqi);
  const dailySummary = buildDailySummaryText(location.name, currentAqi, pollutants, weather);
  const nowIso = new Date().toISOString();

  return {
    location,
    currentAqi,
    europeanAqi: aqData.current?.european_aqi ?? null,
    classification,
    pollutants,
    weather,
    hourlyTrend,
    dailySummary,
    alerts: generateSafetyAlerts({
      aqi: currentAqi,
      pollutants,
      weather,
      hourlyTrend,
      dataStatus: 'live',
      profile,
    }),
    dataStatus: 'live',
    dataSource: 'Open-Meteo Copernicus CAMS Air Quality & Forecast API',
    lastUpdatedIso: nowIso,
  };
}
