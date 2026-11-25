import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchAirQualitySnapshotApi } from '../services/apiClient.ts';
import { createDefaultUserProfile } from '../shared/profileConstants.ts';
import type {
  ActionPlannerItem,
  AirQualitySnapshot,
  AssistantChatMessage,
  DailyRoutinePlan,
  LocationSelection,
  UserProfile,
} from '../shared/types.ts';
import { sanitizeUserProfile } from '../shared/validation.ts';

const PROFILE_STORAGE_KEY = 'airaware_user_profile_v1';
const ACTIONS_STORAGE_KEY = 'airaware_action_planner_v1';
const ROUTINE_STORAGE_KEY = 'airaware_daily_routine_v1';
const CHAT_STORAGE_KEY = 'airaware_chat_history_v1';
const JOINED_CHALLENGES_KEY = 'airaware_joined_challenges_v1';

export const DEFAULT_USER_PROFILE: UserProfile = createDefaultUserProfile();

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildPersonalizedActions(profile: UserProfile, aqi: number): ActionPlannerItem[] {
  const isHighSmog = aqi > 100;
  const isLowBudget = profile.budget === 'low';
  const hasSensitive =
    profile.sensitiveGroups.children ||
    profile.sensitiveGroups.elderly ||
    profile.sensitiveGroups.pregnant ||
    profile.sensitiveGroups.respiratoryOrCardiac;

  return [
    {
      id: 'act-morning-seal',
      title: isHighSmog
        ? `Keep ${profile.location.name} bedroom & living room windows sealed during early-morning inversion`
        : `Open cross-ventilation windows for 15 minutes while ${profile.location.name} outdoor AQI is low`,
      period: 'Morning',
      category: 'indoor_air',
      priority: isHighSmog || hasSensitive ? 'high' : 'medium',
      estimatedCost: 'Free',
      environmentalBenefit: isHighSmog
        ? 'Prevents outdoor PM2.5 spikes from infiltrating indoor breathing zones.'
        : 'Flushes indoor CO2 and cooking VOCs without energy penalty.',
      assumptionsNote:
        'Effectiveness depends on window frame sealing; indoor PM2.5 typically tracks outdoor levels within 30–90 minutes in leaky rooms.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-morning-commute',
      title:
        profile.commuteMethod === 'private_car_petrol'
          ? 'Substitute today’s solo car commute with metro, bus, or carpool'
          : isHighSmog
            ? 'Wear a fitted N95/FFP2 respirator along busy traffic corridors'
            : 'Take low-traffic side streets away from arterial diesel corridors',
      period: 'Morning',
      category: 'commute',
      priority: 'high',
      estimatedCost:
        profile.commuteMethod === 'private_car_petrol' ? 'Saves ~$3–$6 fuel' : '$1–$2 mask reuse',
      environmentalBenefit:
        'Reduces cold-start tailpipe NO2/PM2.5 emissions and lowers personal inhaled traffic exhaust.',
      assumptionsNote:
        'Estimated 1.5–4.5 kg CO2e saved per replaced 15 km solo petrol round trip; varies by local transit occupancy.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-afternoon-cook',
      title: 'Run kitchen exhaust hood (or open kitchen window briefly) while cooking and 10 min after',
      period: 'Afternoon',
      category: 'indoor_air',
      priority: 'high',
      estimatedCost: 'Free',
      environmentalBenefit:
        'Captures ultrafine cooking aerosols, NO2 from gas burners, and moisture before they spread to bedrooms.',
      assumptionsNote:
        'Back burners under an exterior-vented hood capture significantly more plume aerosols than front burners.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-afternoon-dust',
      title: isLowBudget
        ? 'Wet-mop hard floors & wipe sills instead of dry sweeping; seal window gaps with folded cloth/foam'
        : 'Run true HEPA H13 purifier on Medium in primary living area and wet-dust surfaces',
      period: 'Afternoon',
      category: 'indoor_air',
      priority: isHighSmog ? 'high' : 'medium',
      estimatedCost: isLowBudget ? 'Free – $8 foam tape' : '$15–$40 filter upkeep/mo',
      environmentalBenefit:
        'Prevents settled PM10/PM2.5 dust resuspension without adding ozone or chemical sprays.',
      assumptionsNote:
        'Dry brooms re-aerosolize settled particulate matter; damp microfiber captures particles directly.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-evening-energy',
      title: 'Avoid burning candles, incense, or outdoor waste; trim evening standby appliance load',
      period: 'Evening',
      category: 'energy_waste',
      priority: 'medium',
      estimatedCost: 'Free (lowers utility bill)',
      environmentalBenefit:
        'Eliminates direct indoor combustion PM2.5 and reduces winter peak grid demand.',
      assumptionsNote:
        'Even a single incense stick or scented candle can raise small-room PM2.5 substantially in sealed winter rooms.',
      completed: false,
      completedDates: [],
    },
    {
      id: 'act-evening-sleep',
      title: hasSensitive
        ? 'Designate one clean-air bedroom for children/seniors with closed door and filtered air'
        : 'Keep bedroom door shut at night and review tomorrow’s morning AQI window',
      period: 'Evening',
      category: 'outdoor_protection',
      priority: hasSensitive || isHighSmog ? 'high' : 'low',
      estimatedCost: 'Free',
      environmentalBenefit:
        'Protects 7–9 hours of overnight respiratory recovery when winter inversion peaks occur.',
      assumptionsNote:
        'Overnight boundary-layer inversions frequently trap residential heating and traffic particulates until mid-morning.',
      completed: false,
      completedDates: [],
    },
  ];
}

function mergeActionsWithCompletionState(
  existing: ActionPlannerItem[],
  regenerated: ActionPlannerItem[]
): ActionPlannerItem[] {
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const customOnes = existing.filter((item) => item.isCustom);
  const synced = regenerated.map((item) => {
    const prev = existingById.get(item.id);
    if (!prev) return item;
    return {
      ...item,
      completed: prev.completed,
      completedDates: prev.completedDates,
    };
  });
  return [...customOnes, ...synced];
}

interface AirAwareContextValue {
  profile: UserProfile;
  snapshot: AirQualitySnapshot | null;
  loadingSnapshot: boolean;
  snapshotError: string | null;
  actions: ActionPlannerItem[];
  routinePlan: DailyRoutinePlan | null;
  chatHistory: AssistantChatMessage[];
  joinedChallenges: string[];
  updateProfile: (next: UserProfile) => void;
  setLocation: (loc: LocationSelection) => void;
  refreshSnapshot: (force?: boolean) => Promise<void>;
  toggleActionComplete: (actionId: string) => void;
  addCustomAction: (item: Omit<ActionPlannerItem, 'id' | 'completed' | 'completedDates'>) => void;
  regenerateActionsForCurrentAqi: () => void;
  setRoutinePlan: (plan: DailyRoutinePlan | null) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<AssistantChatMessage[]>>;
  markChallengeJoined: (challengeId: string) => void;
  resetAllLocalData: () => void;
}

const AirAwareContext = createContext<AirAwareContextValue | undefined>(undefined);

function safeReadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const AirAwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const raw = safeReadStorage<unknown>(PROFILE_STORAGE_KEY, null);
    return sanitizeUserProfile(raw, DEFAULT_USER_PROFILE);
  });
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState<boolean>(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionPlannerItem[]>(() => {
    const saved = safeReadStorage<ActionPlannerItem[] | null>(ACTIONS_STORAGE_KEY, null);
    return saved && saved.length > 0 ? saved : buildPersonalizedActions(profile, 140);
  });
  const [routinePlan, setRoutinePlanState] = useState<DailyRoutinePlan | null>(() =>
    safeReadStorage<DailyRoutinePlan | null>(ROUTINE_STORAGE_KEY, null)
  );
  const [chatHistory, setChatHistory] = useState<AssistantChatMessage[]>(() =>
    safeReadStorage<AssistantChatMessage[]>(CHAT_STORAGE_KEY, [])
  );
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(() =>
    safeReadStorage<string[]>(JOINED_CHALLENGES_KEY, [])
  );

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore quota failures
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actions));
    } catch {
      // ignore
    }
  }, [actions]);

  useEffect(() => {
    try {
      if (routinePlan) {
        localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routinePlan));
      } else {
        localStorage.removeItem(ROUTINE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [routinePlan]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory.slice(-20)));
    } catch {
      // ignore
    }
  }, [chatHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(JOINED_CHALLENGES_KEY, JSON.stringify(joinedChallenges));
    } catch {
      // ignore
    }
  }, [joinedChallenges]);

  const refreshSnapshot = useCallback(
    async (force = false) => {
      setLoadingSnapshot(true);
      setSnapshotError(null);
      try {
        const nextSnapshot = await fetchAirQualitySnapshotApi({
          location: profile.location,
          profile,
          forceRefresh: force,
        });
        setSnapshot(nextSnapshot);
        // Automatically align recommended daily actions with new location/AQI while preserving completions
        setActions((prev) =>
          mergeActionsWithCompletionState(
            prev,
            buildPersonalizedActions(profile, nextSnapshot.currentAqi)
          )
        );
      } catch (err) {
        setSnapshotError(
          err instanceof Error ? err.message : 'Unable to fetch air quality readings right now.'
        );
      } finally {
        setLoadingSnapshot(false);
      }
    },
    [profile]
  );

  useEffect(() => {
    void refreshSnapshot(false);
  }, [refreshSnapshot]);

  const updateProfile = useCallback((next: UserProfile) => {
    setProfile(sanitizeUserProfile(next, DEFAULT_USER_PROFILE));
  }, []);

  const setLocation = useCallback((loc: LocationSelection) => {
    setProfile((prev) => ({
      ...prev,
      location: loc,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const toggleActionComplete = useCallback((actionId: string) => {
    const today = todayDateKey();
    setActions((prev) =>
      prev.map((item) => {
        if (item.id !== actionId) return item;
        const nextCompleted = !item.completed;
        const dates = nextCompleted
          ? Array.from(new Set([...item.completedDates, today]))
          : item.completedDates.filter((d) => d !== today);
        return {
          ...item,
          completed: nextCompleted,
          completedDates: dates,
        };
      })
    );
  }, []);

  const addCustomAction = useCallback(
    (item: Omit<ActionPlannerItem, 'id' | 'completed' | 'completedDates'>) => {
      const created: ActionPlannerItem = {
        ...item,
        id: `custom-${Date.now()}`,
        completed: false,
        completedDates: [],
        isCustom: true,
      };
      setActions((prev) => [created, ...prev]);
    },
    []
  );

  const regenerateActionsForCurrentAqi = useCallback(() => {
    const aqi = snapshot?.currentAqi ?? 140;
    const generated = buildPersonalizedActions(profile, aqi);
    setActions((prev) => mergeActionsWithCompletionState(prev, generated));
  }, [profile, snapshot]);

  const setRoutinePlan = useCallback((plan: DailyRoutinePlan | null) => {
    setRoutinePlanState(plan);
  }, []);

  const markChallengeJoined = useCallback((challengeId: string) => {
    setJoinedChallenges((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));
  }, []);

  const resetAllLocalData = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(ACTIONS_STORAGE_KEY);
      localStorage.removeItem(ROUTINE_STORAGE_KEY);
      localStorage.removeItem(CHAT_STORAGE_KEY);
      localStorage.removeItem(JOINED_CHALLENGES_KEY);
    } catch {
      // ignore
    }
    const resetProfile = createDefaultUserProfile();
    setProfile(resetProfile);
    setActions(buildPersonalizedActions(resetProfile, 140));
    setRoutinePlanState(null);
    setChatHistory([]);
    setJoinedChallenges([]);
  }, []);

  return (
    <AirAwareContext.Provider
      value={{
        profile,
        snapshot,
        loadingSnapshot,
        snapshotError,
        actions,
        routinePlan,
        chatHistory,
        joinedChallenges,
        updateProfile,
        setLocation,
        refreshSnapshot,
        toggleActionComplete,
        addCustomAction,
        regenerateActionsForCurrentAqi,
        setRoutinePlan,
        setChatHistory,
        markChallengeJoined,
        resetAllLocalData,
      }}
    >
      {children}
    </AirAwareContext.Provider>
  );
};

export function useAirAware(): AirAwareContextValue {
  const ctx = useContext(AirAwareContext);
  if (!ctx) {
    throw new Error('useAirAware must be used within AirAwareProvider');
  }
  return ctx;
}
