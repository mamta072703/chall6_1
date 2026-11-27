import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchAirQualitySnapshotApi } from '../services/apiClient.ts';
import {
  buildPersonalizedActions,
  mergeActionsWithCompletionState,
} from '../shared/actionGenerator.ts';
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

export { buildPersonalizedActions };

const PROFILE_STORAGE_KEY = 'airaware_user_profile_v1';
const ACTIONS_STORAGE_KEY = 'airaware_action_planner_v1';
const ROUTINE_STORAGE_KEY = 'airaware_daily_routine_v1';
const CHAT_STORAGE_KEY = 'airaware_chat_history_v1';
const JOINED_CHALLENGES_KEY = 'airaware_joined_challenges_v1';

export const DEFAULT_USER_PROFILE: UserProfile = createDefaultUserProfile();

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
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
