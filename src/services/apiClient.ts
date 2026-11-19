import {
  buildSampleFallbackSnapshot,
  fetchOpenMeteoSnapshot,
  searchOpenMeteoLocations,
} from '../shared/openMeteoClient.ts';
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

const LOCAL_COMMUNITY_KEY = 'airaware_static_community_v1';

interface LocalCommunityState {
  stats: CommunityAggregateStats;
  tips: CommunityTip[];
  challenges: CommunityChallenge[];
  campaigns: CommunityCampaign[];
}

const STATIC_COMMUNITY_SEED: LocalCommunityState = {
  stats: {
    totalCleanCommuteDays: 1428,
    totalIndoorProtectionActions: 3190,
    totalEnergySavingActions: 2045,
    activeHouseholdsParticipating: 384,
    methodologyNote:
      'Aggregated anonymized counts across participating households (local session fallback active when backend API is unavailable).',
  },
  tips: [
    {
      id: 'tip-1',
      category: 'indoor_air',
      title: 'Seal bedroom window frames with foam weatherstripping before winter peaks',
      body: 'Adding adhesive EPDM foam tape around sliding window tracks visibly cuts cold drafts and fine particulate infiltration overnight for under $10.',
      estimatedCostLabel: 'Low cost ($5–$12)',
      helpfulCount: 42,
      createdAtIso: '2026-11-10T08:30:00.000Z',
    },
    {
      id: 'tip-2',
      category: 'clean_commute',
      title: 'Switch morning school drop-offs under 2 km to walking groups or metro feeder',
      body: 'Short cold-start petrol trips generate disproportionate exhaust near school gates. Coordinating a 4-family walking bus removes 3–4 cold starts daily.',
      estimatedCostLabel: 'Free',
      helpfulCount: 37,
      createdAtIso: '2026-11-12T14:15:00.000Z',
    },
    {
      id: 'tip-4',
      category: 'indoor_air',
      title: 'Run kitchen exhaust hood 10 minutes past cooking completion',
      body: 'High-heat frying and gas burners emit ultrafine particles and NO2 that linger after turning off the stove. Using back burners under the hood improves capture.',
      estimatedCostLabel: 'Free',
      helpfulCount: 51,
      createdAtIso: '2026-11-15T18:20:00.000Z',
    },
  ],
  challenges: [
    {
      id: 'challenge-transit-week',
      title: '5-Day Low-Emission Commute Shift',
      description:
        'Replace solo petrol/diesel commutes with metro, bus, carpooling, cycling (when AQI < 100), or remote work for five workdays.',
      targetActions: 5,
      participantsCount: 164,
      collectiveCompletions: 612,
      durationLabel: 'Weekly Sprint',
    },
    {
      id: 'challenge-clean-bedroom',
      title: 'Clean-Air Bedroom Setup',
      description:
        'Wet-mop floors, seal window drafts, eliminate indoor incense/candles, and designate one filtered sleeping space for family members.',
      targetActions: 4,
      participantsCount: 218,
      collectiveCompletions: 790,
      durationLabel: '7-Day Habit',
    },
    {
      id: 'challenge-zero-burn',
      title: 'Zero Open-Burn & Energy Trim',
      description:
        'Commit to zero outdoor leaf/waste burning, lower standby appliance load, and shift high-heat frying under vented hoods.',
      targetActions: 3,
      participantsCount: 129,
      collectiveCompletions: 348,
      durationLabel: 'Ongoing Winter Pledge',
    },
  ],
  campaigns: [
    {
      id: 'campaign-school-idle',
      title: 'Clean School Gate Zones',
      focusArea: 'Local Transport & Child Exposure',
      summary:
        'Encouraging caregivers and bus operators to turn off idling engines during morning and afternoon school pickup windows.',
      actionSteps: [
        'Park 200 meters away from school gates when feasible',
        'Switch off engine immediately if waiting over 30 seconds',
        'Check morning AQI before outdoor recess schedules',
      ],
    },
  ],
};

function readStaticCommunity(): LocalCommunityState {
  try {
    const raw = localStorage.getItem(LOCAL_COMMUNITY_KEY);
    if (raw) return JSON.parse(raw) as LocalCommunityState;
  } catch {
    // ignore
  }
  return structuredClone(STATIC_COMMUNITY_SEED);
}

function writeStaticCommunity(state: LocalCommunityState): void {
  try {
    localStorage.setItem(LOCAL_COMMUNITY_KEY, JSON.stringify(state));
  } catch {
    // ignore
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
    if (res.ok) {
      return await parseJsonOrThrow(res);
    }
    if (!isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // Fall back to direct browser Open-Meteo geocoding on static deployments
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
    if (res.ok) {
      return await parseJsonOrThrow(res);
    }
    if (!isBackendUnavailableStatus(res.status)) {
      return await parseJsonOrThrow(res);
    }
  } catch {
    // Fall back to direct Open-Meteo fetch if backend proxy is unavailable (e.g., static deploy)
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

export async function fetchCommunityOverviewApi(): Promise<LocalCommunityState> {
  try {
    const res = await fetch('/api/community');
    if (res.ok) {
      return await parseJsonOrThrow(res);
    }
    if (!isBackendUnavailableStatus(res.status)) {
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
    title: input.title.replace(/[<>]/g, '').trim().slice(0, 120),
    body: input.body.replace(/[<>]/g, '').trim().slice(0, 400),
    estimatedCostLabel: input.estimatedCostLabel.replace(/[<>]/g, '').trim() || 'Free',
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
