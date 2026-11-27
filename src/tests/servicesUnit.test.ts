// @vitest-environment node
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CommunityRepository } from '../server/repositories/communityRepository.ts';
import { AirQualityService } from '../server/services/airQualityService.ts';

describe('AirQualityService & CommunityRepository Unit Suites', () => {
  it('serves cached live snapshots until TTL expires or forceRefresh is requested', async () => {
    const mockFetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes('air-quality-api.open-meteo.com')) {
        return new Response(
          JSON.stringify({
            current: { us_aqi: 145, pm2_5: 62.5, pm10: 110.2 },
            hourly: { time: ['2026-11-16T08:00'], us_aqi: [145], pm2_5: [62.5], pm10: [110.2] },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ current: { temperature_2m: 9, wind_speed_10m: 5, weather_code: 45 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const service = new AirQualityService({ cacheTtlMs: 60_000, fetcher: mockFetcher });
    const location = { name: 'Milan', latitude: 45.4642, longitude: 9.19 };

    const first = await service.getSnapshot({ location });
    expect(first.dataStatus).toBe('live');
    expect(mockFetcher).toHaveBeenCalledTimes(2);

    const second = await service.getSnapshot({ location });
    expect(second.dataStatus).toBe('cached');
    expect(mockFetcher).toHaveBeenCalledTimes(2);

    const forced = await service.getSnapshot({ location, forceRefresh: true });
    expect(forced.dataStatus).toBe('live');
    expect(mockFetcher).toHaveBeenCalledTimes(4);
  });

  it('caches location search results and falls back to offline directory on failure', async () => {
    let shouldFail = false;
    const mockFetcher = vi.fn<typeof fetch>(async () => {
      if (shouldFail) throw new Error('Geocoding offline');
      return new Response(
        JSON.stringify({
          results: [{ name: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587 }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const service = new AirQualityService({ cacheTtlMs: 60_000, fetcher: mockFetcher });
    const liveSearch = await service.searchLocations('Lahore');
    expect(liveSearch.source).toBe('open_meteo_geocoding');
    expect(liveSearch.results[0].name).toBe('Lahore');

    const cachedSearch = await service.searchLocations('lahore');
    expect(cachedSearch.source).toBe('open_meteo_geocoding');
    expect(mockFetcher).toHaveBeenCalledTimes(1);

    shouldFail = true;
    const offlineSearch = await service.searchLocations('Delhi');
    expect(offlineSearch.source).toBe('offline_directory_fallback');
    expect(offlineSearch.results.some((r) => r.name.includes('Delhi'))).toBe(true);
  });

  it('persists community tips with unique IDs and handles missing IDs cleanly', async () => {
    const tempDir = path.join(os.tmpdir(), `airaware-repo-${Date.now()}-${Math.random()}`);
    const repo = new CommunityRepository(tempDir);

    const t1 = await repo.addTip({
      category: 'clean_commute',
      title: 'Carpool Tuesday and Thursday',
      body: 'Sharing school drop-offs with neighbor reduces cold-start morning tailpipe emissions.',
      estimatedCostLabel: 'Free',
    });
    const t2 = await repo.addTip({
      category: 'energy_saving',
      title: 'Seal drafty balcony tracks',
      body: 'Adding adhesive brush seals along sliding glass doors cuts heat loss and smog entry.',
      estimatedCostLabel: '$6',
    });

    expect(t1.id).not.toBe(t2.id);
    expect(await repo.markTipHelpful('missing-tip-id')).toBeNull();
    expect(await repo.recordChallengeAction('missing-challenge-id', true)).toBeNull();

    const reloaded = new CommunityRepository(tempDir);
    const overview = await reloaded.getOverview();
    expect(overview.tips.some((t) => t.id === t1.id)).toBe(true);
    expect(overview.tips.some((t) => t.id === t2.id)).toBe(true);
  });
});
