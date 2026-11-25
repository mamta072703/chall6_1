import {
  createDefaultCommunityData,
  type CommunityStoreData,
} from '../shared/communitySeed.ts';
import {
  buildSampleFallbackSnapshot,
  fetchOpenMeteoSnapshot,
  searchOpenMeteoLocations,
} from '../shared/openMeteoClient.ts';
import type {
  AirQualitySnapshot,
  AssistantChatMessage,
  CommunityChallenge,
  CommunityTip,
  DailyRoutinePlan,
  EnvironmentalImpactDetail,
  LocationSelection,
  UserProfile,
} from '../shared/types.ts';
import { sanitizePlainText } from '../shared/validation.ts';

const LOCAL_COMMUNITY_KEY = 'airaware_static_community_v1';

function readStaticCommunity(): CommunityStoreData {
  try {
    const raw = localStorage.getItem(LOCAL_COMMUNITY_KEY);
    if (raw) return JSON.parse(raw) as CommunityStoreData;
  } catch {
    // ignore storage failures
  }
  return createDefaultCommunityData(' (Local session mode active without backend persistence.)');
}

function writeStaticCommunity(state: CommunityStoreData): void {
  try {
    localStorage.setItem(LOCAL_COMMUNITY_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function isBackendUnavailableStatus(status: number): boolean {
  return status === 404 || status === 405;
}

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
  try {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
    if (res.ok || !isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // Fall back to direct Open-Meteo geocoding on static deployments
  }
  return searchOpenMeteoLocations(query);
}

export async function fetchAirQualitySnapshotApi(params: {
  location: LocationSelection;
  profile?: UserProfile;
  forceRefresh?: boolean;
}): Promise<AirQualitySnapshot> {
  try {
    const res = await fetch('/api/air-quality/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok || !isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // Fall back to direct Open-Meteo fetch if backend proxy is unavailable
  }

  try {
    return await fetchOpenMeteoSnapshot({
      location: params.location,
      profile: params.profile,
    });
  } catch {
    return buildSampleFallbackSnapshot(params.location, params.profile);
  }
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
  if (isBackendUnavailableStatus(res.status)) {
    throw new Error(
      'The Gemini AI backend endpoint is not running on this static deployment. Start the full-stack server (`npm start`) with GEMINI_API_KEY configured to generate live AI routines.'
    );
  }
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
  if (isBackendUnavailableStatus(res.status)) {
    throw new Error(
      'The Gemini AI backend endpoint is not running on this static deployment. Start the full-stack server (`npm start`) with GEMINI_API_KEY configured to use the AI Assistant.'
    );
  }
  return parseJsonOrThrow(res);
}

export async function fetchCommunityOverviewApi(): Promise<CommunityStoreData> {
  try {
    const res = await fetch('/api/community');
    if (res.ok || !isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // Fall back to local community seed on static deployments
  }
  return readStaticCommunity();
}

export async function createCommunityTipApi(input: {
  category: CommunityTip['category'];
  title: string;
  body: string;
  estimatedCostLabel: string;
}): Promise<CommunityTip> {
  try {
    const res = await fetch('/api/community/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok || !isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // static fallback
  }

  const state = readStaticCommunity();
  const created: CommunityTip = {
    id: `tip-${Date.now()}`,
    category: input.category,
    title: sanitizePlainText(input.title, 120),
    body: sanitizePlainText(input.body, 400),
    estimatedCostLabel: sanitizePlainText(input.estimatedCostLabel, 40) || 'Free',
    helpfulCount: 1,
    createdAtIso: new Date().toISOString(),
  };
  state.tips = [created, ...state.tips];
  writeStaticCommunity(state);
  return created;
}

export async function markTipHelpfulApi(tipId: string): Promise<CommunityTip> {
  try {
    const res = await fetch(`/api/community/tips/${encodeURIComponent(tipId)}/helpful`, {
      method: 'POST',
    });
    if (res.ok || !isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // static fallback
  }

  const state = readStaticCommunity();
  const target = state.tips.find((t) => t.id === tipId);
  if (!target) throw new Error('Community tip not found.');
  target.helpfulCount += 1;
  writeStaticCommunity(state);
  return target;
}

export async function recordChallengeActionApi(
  challengeId: string,
  joinedNow: boolean
): Promise<CommunityChallenge> {
  try {
    const res = await fetch(`/api/community/challenges/${encodeURIComponent(challengeId)}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinedNow }),
    });
    if (res.ok || !isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // static fallback
  }

  const state = readStaticCommunity();
  const challenge = state.challenges.find((c) => c.id === challengeId);
  if (!challenge) throw new Error('Community challenge not found.');
  if (joinedNow) {
    challenge.participantsCount += 1;
    state.stats.activeHouseholdsParticipating += 1;
  } else {
    challenge.collectiveCompletions += 1;
    state.stats.totalIndoorProtectionActions += 1;
  }
  writeStaticCommunity(state);
  return challenge;
}
