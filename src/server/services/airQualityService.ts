import { generateSafetyAlerts } from '../../shared/aqiUtils.ts';
import {
  buildSampleFallbackSnapshot,
  fetchOpenMeteoSnapshot,
  searchOpenMeteoLocations,
} from '../../shared/openMeteoClient.ts';
import type { AirQualitySnapshot, LocationSelection, UserProfile } from '../../shared/types.ts';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  cachedAtIso: string;
}

export class AirQualityService {
  private readonly aqCache = new Map<string, CacheEntry<AirQualitySnapshot>>();
  private readonly geoCache = new Map<string, CacheEntry<LocationSelection[]>>();
  private readonly cacheTtlMs: number;
  private readonly fetcher: typeof fetch;

  constructor(options?: { cacheTtlMs?: number; fetcher?: typeof fetch }) {
    this.cacheTtlMs =
      options?.cacheTtlMs ??
      (Number(process.env.AQ_CACHE_TTL_MS) > 0 ? Number(process.env.AQ_CACHE_TTL_MS) : 600_000);
    this.fetcher = options?.fetcher ?? fetch;
  }

  async searchLocations(query: string): Promise<{
    results: LocationSelection[];
    source: 'open_meteo_geocoding' | 'offline_directory_fallback';
  }> {
    const trimmed = query.trim();
    const cacheKey = trimmed.toLowerCase();
    if (trimmed.length >= 2) {
      const cached = this.geoCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return { results: cached.value, source: 'open_meteo_geocoding' };
      }
    }

    const result = await searchOpenMeteoLocations(trimmed, this.fetcher);
    if (trimmed.length >= 2 && result.source === 'open_meteo_geocoding') {
      this.geoCache.set(cacheKey, {
        value: result.results,
        expiresAt: Date.now() + this.cacheTtlMs * 3,
        cachedAtIso: new Date().toISOString(),
      });
    }
    return result;
  }

  async getSnapshot(params: {
    location: LocationSelection;
    profile?: UserProfile;
    forceRefresh?: boolean;
  }): Promise<AirQualitySnapshot> {
    const { location, profile, forceRefresh = false } = params;
    const coordKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
    const existing = this.aqCache.get(coordKey);

    if (!forceRefresh && existing && existing.expiresAt > Date.now()) {
      return {
        ...existing.value,
        location,
        dataStatus: 'cached',
        alerts: generateSafetyAlerts({
          aqi: existing.value.currentAqi,
          pollutants: existing.value.pollutants,
          weather: existing.value.weather,
          hourlyTrend: existing.value.hourlyTrend,
          dataStatus: 'cached',
          profile,
        }),
      };
    }

    try {
      const snapshot = await fetchOpenMeteoSnapshot({
        location,
        profile,
        fetcher: this.fetcher,
      });

      this.aqCache.set(coordKey, {
        value: snapshot,
        expiresAt: Date.now() + this.cacheTtlMs,
        cachedAtIso: snapshot.lastUpdatedIso,
      });

      return snapshot;
    } catch (error) {
      console.warn('Upstream air quality fetch failed, returning explicit sample fallback:', error);
      return buildSampleFallbackSnapshot(location, profile);
    }
  }
}
