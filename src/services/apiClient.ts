import type {
  AirQualitySnapshot,
  AssistantChatMessage,
  CommunityAggregateStats,
  CommunityCampaign,
  CommunityChallenge,
  CommunityTip,
  DailyRoutinePlan,
  EnvironmentalImpactDetail,
  LocationSelection,
  UserProfile,
} from '../shared/types.ts';

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) {
    const err = new Error(data.error || `Request failed with HTTP ${res.status}`);
    (err as Error & { code?: string; status?: number }).code = data.code;
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return data;
}

export async function searchLocationsApi(query: string): Promise<{
  results: LocationSelection[];
  source: 'open_meteo_geocoding' | 'offline_directory_fallback';
}> {
  const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
  return parseJsonOrThrow(res);
}

export async function fetchAirQualitySnapshotApi(params: {
  location: LocationSelection;
  profile?: UserProfile;
  forceRefresh?: boolean;
}): Promise<AirQualitySnapshot> {
  const res = await fetch('/api/air-quality/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parseJsonOrThrow(res);
}

export async function generateDailyRoutineApi(params: {
  profile: UserProfile;
  snapshot: AirQualitySnapshot;
}): Promise<DailyRoutinePlan> {
  const res = await fetch('/api/ai/routine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parseJsonOrThrow(res);
}

export async function askAssistantApi(params: {
  question: string;
  history: AssistantChatMessage[];
  profile: UserProfile;
  snapshot: AirQualitySnapshot;
}): Promise<{
  answer: string;
  impactCard: EnvironmentalImpactDetail;
  followUpSuggestions: string[];
}> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parseJsonOrThrow(res);
}

export async function fetchCommunityOverviewApi(): Promise<{
  stats: CommunityAggregateStats;
  tips: CommunityTip[];
  challenges: CommunityChallenge[];
  campaigns: CommunityCampaign[];
}> {
  const res = await fetch('/api/community');
  return parseJsonOrThrow(res);
}

export async function createCommunityTipApi(input: {
  category: CommunityTip['category'];
  title: string;
  body: string;
  estimatedCostLabel: string;
}): Promise<CommunityTip> {
  const res = await fetch('/api/community/tips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(res);
}

export async function markTipHelpfulApi(tipId: string): Promise<CommunityTip> {
  const res = await fetch(`/api/community/tips/${encodeURIComponent(tipId)}/helpful`, {
    method: 'POST',
  });
  return parseJsonOrThrow(res);
}

export async function recordChallengeActionApi(
  challengeId: string,
  joinedNow: boolean
): Promise<CommunityChallenge> {
  const res = await fetch(`/api/community/challenges/${encodeURIComponent(challengeId)}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ joinedNow }),
  });
  return parseJsonOrThrow(res);
}
