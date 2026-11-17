import { describe, expect, it } from 'vitest';
import {
  assessInversionRisk,
  calculateRecommendedCadr,
  classifyUsAqi,
  estimateCommuteImpact,
  generateSafetyAlerts,
} from '../shared/aqiUtils.ts';

describe('AQI Classification & Environmental Utilities', () => {
  it('classifies all US EPA AQI bands accurately with explicit non-color labels', () => {
    expect(classifyUsAqi(28).label).toBe('Good');
    expect(classifyUsAqi(75).label).toBe('Moderate');
    expect(classifyUsAqi(132).label).toBe('Unhealthy for Sensitive Groups');
    expect(classifyUsAqi(180).label).toBe('Unhealthy');
    expect(classifyUsAqi(245).label).toBe('Very Unhealthy');
    expect(classifyUsAqi(360).label).toBe('Hazardous');
  });

  it('handles invalid or missing AQI values safely without NaN', () => {
    expect(classifyUsAqi(null).key).toBe('good');
    expect(classifyUsAqi(undefined).key).toBe('good');
    expect(classifyUsAqi(-15).key).toBe('good');
  });

  it('generates severe pollution, PM2.5, inversion, and sample fallback alerts', () => {
    const alerts = generateSafetyAlerts({
      aqi: 235,
      pollutants: { pm25: 112.4, pm10: 190, no2: 45, so2: 10, co: 800, o3: 25 },
      weather: {
        temperatureC: 7,
        humidityPercent: 78,
        windSpeedKmh: 3.5,
        surfacePressureHpa: 1020,
        weatherSummary: 'Winter fog',
        inversionRisk: 'high',
      },
      hourlyTrend: [
        { timeIso: '2026-11-16T06:00', label: '11-16 06:00', usAqi: 150, pm25: 70, pm10: 110 },
        { timeIso: '2026-11-16T07:00', label: '11-16 07:00', usAqi: 170, pm25: 80, pm10: 120 },
        { timeIso: '2026-11-16T08:00', label: '11-16 08:00', usAqi: 210, pm25: 95, pm10: 150 },
        { timeIso: '2026-11-16T09:00', label: '11-16 09:00', usAqi: 235, pm25: 112, pm10: 190 },
      ],
      dataStatus: 'sample_fallback',
    });

    const ids = alerts.map((a) => a.id);
    expect(ids).toContain('data-fallback-notice');
    expect(ids).toContain('severe-aqi-alert');
    expect(ids).toContain('high-pm25');
    expect(ids).toContain('winter-inversion');
    expect(ids).toContain('aqi-swing');
  });

  it('estimates commute CO2e savings as transparent uncertainty ranges', () => {
    const switchSavings = estimateCommuteImpact('private_car_petrol', 'public_transit', 20, 5);
    expect(switchSavings.estimatedKgCo2eSavedRange).toContain('±25% range');
    expect(switchSavings.assumptions).toContain('20 km/day');

    const alreadyLow = estimateCommuteImpact('walking', 'cycling', 10, 5);
    expect(alreadyLow.estimatedKgCo2eSavedRange).toContain('already low-emission baseline');
  });

  it('calculates HEPA CADR recommendations and inversion risk properly', () => {
    const cadr = calculateRecommendedCadr(20);
    expect(cadr.cadrM3PerHour).toBeGreaterThan(200);
    expect(cadr.cadrCfm).toBeGreaterThan(100);
    expect(assessInversionRisk(4, 8)).toBe('high');
    expect(assessInversionRisk(18, 12)).toBe('low');
  });
});
