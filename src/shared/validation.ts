import { classifyUsAqi } from './aqiUtils.ts';
import type {
  AirQualitySnapshot,
  BudgetTier,
  CommuteMethod,
  LifestyleType,
  LocationSelection,
  MainConcern,
  OutdoorActivityLevel,
  UserProfile,
} from './types.ts';

const VALID_COMMUTES: ReadonlySet<CommuteMethod> = new Set([
  'public_transit',
  'walking',
  'cycling',
  'carpool',
  'private_car_petrol',
  'electric_vehicle',
  'work_from_home',
]);

const VALID_LIFESTYLES: ReadonlySet<LifestyleType> = new Set([
  'family_with_children',
  'working_professional',
  'student',
  'senior_household',
  'mixed_multigenerational',
]);

const VALID_OUTDOOR: ReadonlySet<OutdoorActivityLevel> = new Set(['low', 'moderate', 'high']);
const VALID_BUDGETS: ReadonlySet<BudgetTier> = new Set(['low', 'medium', 'high']);
const VALID_CONCERNS: ReadonlySet<MainConcern> = new Set([
  'indoor_air',
  'outdoor_smog',
  'commuting',
  'sustainability',
]);

/**
 * Strips control characters, HTML angle brackets, normalizes whitespace, and caps length.
 */
export function sanitizePlainText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Neutralizes common prompt-injection delimiters while preserving legitimate user questions.
 */
export function sanitizePromptInput(input: unknown, maxLength = 800): string {
  const cleaned = sanitizePlainText(input, maxLength);
  return cleaned
    .replace(/```/g, "'")
    .replace(/\b(system|assistant|developer):/gi, '')
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '[filtered]');
}

export function isValidCoordinate(lat: unknown, lon: unknown): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function parseCoordinateInput(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function validateLocationSelection(raw: unknown): LocationSelection | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = sanitizePlainText(obj.name, 80);
  const latitude = parseCoordinateInput(obj.latitude);
  const longitude = parseCoordinateInput(obj.longitude);
  if (!name || latitude === null || longitude === null || !isValidCoordinate(latitude, longitude)) {
    return null;
  }

  return {
    name,
    country: sanitizePlainText(obj.country, 80) || undefined,
    admin1: sanitizePlainText(obj.admin1, 80) || undefined,
    latitude: Number(latitude.toFixed(4)),
    longitude: Number(longitude.toFixed(4)),
    isManualEntry: Boolean(obj.isManualEntry),
  };
}

export function sanitizeUserProfile(raw: unknown, fallback: UserProfile): UserProfile {
  if (!raw || typeof raw !== 'object') return fallback;
  const obj = raw as Record<string, unknown>;
  const location = validateLocationSelection(obj.location) ?? fallback.location;

  const commuteMethod = VALID_COMMUTES.has(obj.commuteMethod as CommuteMethod)
    ? (obj.commuteMethod as CommuteMethod)
    : fallback.commuteMethod;

  const lifestyle = VALID_LIFESTYLES.has(obj.lifestyle as LifestyleType)
    ? (obj.lifestyle as LifestyleType)
    : fallback.lifestyle;

  const outdoorActivity = VALID_OUTDOOR.has(obj.outdoorActivity as OutdoorActivityLevel)
    ? (obj.outdoorActivity as OutdoorActivityLevel)
    : fallback.outdoorActivity;

  const budget = VALID_BUDGETS.has(obj.budget as BudgetTier)
    ? (obj.budget as BudgetTier)
    : fallback.budget;

  const rawSize = Number(obj.householdSize);
  const householdSize =
    Number.isFinite(rawSize) && rawSize >= 1 ? Math.min(20, Math.round(rawSize)) : fallback.householdSize;

  const rawConcerns = Array.isArray(obj.concerns) ? obj.concerns : [];
  const concerns = rawConcerns
    .filter((c): c is MainConcern => VALID_CONCERNS.has(c as MainConcern))
    .slice(0, 4);

  const sg = (obj.sensitiveGroups && typeof obj.sensitiveGroups === 'object'
    ? obj.sensitiveGroups
    : {}) as Record<string, unknown>;

  return {
    id: sanitizePlainText(obj.id, 64) || fallback.id,
    location,
    commuteMethod,
    householdSize,
    lifestyle,
    outdoorActivity,
    budget,
    concerns: concerns.length > 0 ? concerns : fallback.concerns,
    sensitiveGroups: {
      children: Boolean(sg.children),
      elderly: Boolean(sg.elderly),
      pregnant: Boolean(sg.pregnant),
      respiratoryOrCardiac: Boolean(sg.respiratoryOrCardiac),
    },
    onboardingCompleted: Boolean(obj.onboardingCompleted),
    updatedAt: new Date().toISOString(),
  };
}

function safeNullableNumber(val: unknown, min: number, max: number): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
  return Math.max(min, Math.min(max, num));
}

export function sanitizeAirQualitySnapshot(
  raw: unknown,
  fallbackLocation: LocationSelection
): AirQualitySnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const rawAqi = Number(obj.currentAqi);
  if (!Number.isFinite(rawAqi) || rawAqi < 0 || rawAqi > 1000) return null;

  const location = validateLocationSelection(obj.location) ?? fallbackLocation;
  const p = (obj.pollutants && typeof obj.pollutants === 'object' ? obj.pollutants : {}) as Record<
    string,
    unknown
  >;
  const w = (obj.weather && typeof obj.weather === 'object' ? obj.weather : {}) as Record<
    string,
    unknown
  >;

  const dataStatus =
    obj.dataStatus === 'live' || obj.dataStatus === 'cached' || obj.dataStatus === 'sample_fallback'
      ? obj.dataStatus
      : 'sample_fallback';

  const hourlyTrend = Array.isArray(obj.hourlyTrend)
    ? obj.hourlyTrend.slice(-48).map((pt) => {
        const item = (pt && typeof pt === 'object' ? pt : {}) as Record<string, unknown>;
        return {
          timeIso: sanitizePlainText(item.timeIso, 40),
          label: sanitizePlainText(item.label, 30),
          usAqi: safeNullableNumber(item.usAqi, 0, 1000),
          pm25: safeNullableNumber(item.pm25, 0, 2000),
          pm10: safeNullableNumber(item.pm10, 0, 3000),
        };
      })
    : [];

  const inversionRisk =
    w.inversionRisk === 'low' ||
    w.inversionRisk === 'moderate' ||
    w.inversionRisk === 'high' ||
    w.inversionRisk === 'unknown'
      ? w.inversionRisk
      : 'unknown';

  return {
    location,
    currentAqi: Math.round(rawAqi),
    europeanAqi: safeNullableNumber(obj.europeanAqi, 0, 1000),
    classification: classifyUsAqi(rawAqi),
    pollutants: {
      pm25: safeNullableNumber(p.pm25, 0, 2000),
      pm10: safeNullableNumber(p.pm10, 0, 3000),
      no2: safeNullableNumber(p.no2, 0, 2000),
      so2: safeNullableNumber(p.so2, 0, 2000),
      co: safeNullableNumber(p.co, 0, 50000),
      o3: safeNullableNumber(p.o3, 0, 2000),
    },
    weather: {
      temperatureC: safeNullableNumber(w.temperatureC, -70, 65),
      humidityPercent: safeNullableNumber(w.humidityPercent, 0, 100),
      windSpeedKmh: safeNullableNumber(w.windSpeedKmh, 0, 300),
      surfacePressureHpa: safeNullableNumber(w.surfacePressureHpa, 800, 1100),
      weatherSummary: sanitizePlainText(w.weatherSummary, 80) || 'Unavailable',
      inversionRisk,
    },
    hourlyTrend,
    dailySummary: sanitizePlainText(obj.dailySummary, 300),
    alerts: [],
    dataStatus,
    dataSource: sanitizePlainText(obj.dataSource, 120) || 'Unknown source',
    lastUpdatedIso: sanitizePlainText(obj.lastUpdatedIso, 40) || new Date().toISOString(),
  };
}
