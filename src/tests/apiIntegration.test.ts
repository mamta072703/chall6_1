// @vitest-environment node
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server.ts';
import { CommunityRepository } from '../server/repositories/communityRepository.ts';
import { AirQualityService } from '../server/services/airQualityService.ts';

function buildTestApp(options?: { failUpstream?: boolean }) {
  const tempDir = path.join(os.tmpdir(), `airaware-test-${Date.now()}-${Math.random()}`);
  const communityRepo = new CommunityRepository(tempDir);

  const mockFetcher: typeof fetch = async (input) => {
    if (options?.failUpstream) {
      throw new Error('Network unreachable');
    }
    const url = String(input);
    if (url.includes('air-quality-api.open-meteo.com')) {
      return new Response(
        JSON.stringify({
          current: {
            us_aqi: 164,
            european_aqi: 78,
            pm2_5: 80.2,
            pm10: 132.5,
            nitrogen_dioxide: 42.1,
            sulphur_dioxide: 11.4,
            carbon_monoxide: 710,
            ozone: 29.5,
          },
          hourly: {
            time: ['2026-11-16T08:00', '2026-11-16T09:00'],
            us_aqi: [152, 164],
            pm2_5: [72.1, 80.2],
            pm10: [121.0, 132.5],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        current: {
          temperature_2m: 11.2,
          relative_humidity_2m: 68,
          wind_speed_10m: 5.1,
          surface_pressure: 1018,
          weather_code: 45,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const airQualityService = new AirQualityService({
    fetcher: mockFetcher,
    cacheTtlMs: 60_000,
  });

  return createApp({ airQualityService, communityRepo });
}

describe('AirAware AI Backend API & Security Integration', () => {
  it('returns health status and security headers', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('validates coordinates and returns live air quality snapshot', async () => {
    const app = buildTestApp();

    const invalidRes = await request(app)
      .post('/api/air-quality/snapshot')
      .send({ location: { name: 'Bad', latitude: 240, longitude: 10 } });
    expect(invalidRes.status).toBe(400);

    const validRes = await request(app)
      .post('/api/air-quality/snapshot')
      .send({ location: { name: 'Test City', latitude: 28.61, longitude: 77.2 } });
    expect(validRes.status).toBe(200);
    expect(validRes.body.dataStatus).toBe('live');
    expect(validRes.body.currentAqi).toBe(164);
    expect(validRes.body.classification.label).toBe('Unhealthy');
  });

  it('returns explicitly labeled sample_fallback when upstream API fails', async () => {
    const app = buildTestApp({ failUpstream: true });
    const res = await request(app)
      .post('/api/air-quality/snapshot')
      .send({ location: { name: 'Offline City', latitude: 28.61, longitude: 77.2 } });

    expect(res.status).toBe(200);
    expect(res.body.dataStatus).toBe('sample_fallback');
    expect(res.body.dataSource).toContain('Sample');
  });

  it('sanitizes XSS input and persists anonymized community tips', async () => {
    const app = buildTestApp();

    const badTip = await request(app)
      .post('/api/community/tips')
      .send({ category: 'indoor_air', title: 'Hi', body: 'Too short' });
    expect(badTip.status).toBe(400);

    const xssTip = await request(app)
      .post('/api/community/tips')
      .send({
        category: 'indoor_air',
        title: '<script>alert(1)</script>Seal apartment windows',
        body: 'Use EPDM foam weatherstripping along bedroom frames to reduce winter smog.',
        estimatedCostLabel: 'Low cost',
      });

    expect(xssTip.status).toBe(201);
    expect(xssTip.body.title).not.toContain('<script>');
    expect(xssTip.body.title).toContain('Seal apartment windows');

    const helpfulRes = await request(app).post(`/api/community/tips/${xssTip.body.id}/helpful`);
    expect(helpfulRes.status).toBe(200);
    expect(helpfulRes.body.helpfulCount).toBe(2);
  });

  it('rejects empty AI questions and surfaces missing GEMINI_API_KEY honestly', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const app = buildTestApp();
    const emptyRes = await request(app).post('/api/ai/chat').send({ question: '   ' });
    expect(emptyRes.status).toBe(400);

    const noKeyRes = await request(app)
      .post('/api/ai/chat')
      .send({ question: 'Is it safe to walk outside today?' });
    expect(noKeyRes.status).toBe(503);
    expect(noKeyRes.body.code).toBe('AI_KEY_MISSING');

    const routineNoKeyRes = await request(app).post('/api/ai/routine').send({});
    expect(routineNoKeyRes.status).toBe(503);
    expect(routineNoKeyRes.body.code).toBe('AI_KEY_MISSING');

    if (originalKey !== undefined) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('returns JSON 400 on malformed JSON, JSON 404 on unknown API routes, and records challenge progress', async () => {
    const app = buildTestApp();

    const malformed = await request(app)
      .post('/api/air-quality/snapshot')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error).toContain('Malformed JSON');

    const unknown = await request(app).get('/api/does-not-exist');
    expect(unknown.status).toBe(404);
    expect(unknown.body.error).toBe('API endpoint not found.');

    const overview = await request(app).get('/api/community');
    expect(overview.status).toBe(200);
    const firstChallengeId = overview.body.challenges[0].id;
    const beforeParticipants = overview.body.challenges[0].participantsCount;
    const beforeCompletions = overview.body.challenges[0].collectiveCompletions;

    const joinRes = await request(app)
      .post(`/api/community/challenges/${firstChallengeId}/action`)
      .send({ joinedNow: true });
    expect(joinRes.status).toBe(200);
    expect(joinRes.body.participantsCount).toBe(beforeParticipants + 1);

    const actionRes = await request(app)
      .post(`/api/community/challenges/${firstChallengeId}/action`)
      .send({ joinedNow: false });
    expect(actionRes.status).toBe(200);
    expect(actionRes.body.collectiveCompletions).toBe(beforeCompletions + 1);
  });
});

