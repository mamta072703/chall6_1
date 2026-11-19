import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAirQualitySnapshotApi,
  fetchCommunityOverviewApi,
  searchLocationsApi,
} from '../services/apiClient.ts';

describe('Static Deployment 404 Fallback Resilience', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('recovers gracefully from backend 404 on snapshot, location search, and community endpoints', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/')) {
        return new Response('Not Found', { status: 404 });
      }
      if (url.includes('geocoding-api.open-meteo.com')) {
        return new Response(
          JSON.stringify({
            results: [{ name: 'Milan', country: 'Italy', latitude: 45.4642, longitude: 9.19 }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('air-quality-api.open-meteo.com')) {
        return new Response(
          JSON.stringify({
            current: { us_aqi: 142, pm2_5: 52.1, pm10: 88.4 },
            hourly: { time: ['2026-11-18T10:00'], us_aqi: [142], pm2_5: [52.1], pm10: [88.4] },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          current: { temperature_2m: 8.5, relative_humidity_2m: 70, wind_speed_10m: 4.0, weather_code: 45 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const search = await searchLocationsApi('Milan');
    expect(search.results[0]?.name).toBe('Milan');

    const snapshot = await fetchAirQualitySnapshotApi({
      location: { name: 'Milan', latitude: 45.4642, longitude: 9.19 },
    });
    expect(snapshot.currentAqi).toBe(142);
    expect(snapshot.dataStatus).toBe('live');

    const community = await fetchCommunityOverviewApi();
    expect(community.challenges.length).toBeGreaterThan(0);
    expect(community.tips.length).toBeGreaterThan(0);
  });
});
