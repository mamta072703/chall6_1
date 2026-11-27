import { describe, expect, it } from 'vitest';
import {
  assessInversionRisk,
  calculateRecommendedCadr,
  classifyUsAqi,
  estimateCommuteImpact,
  generateSafetyAlerts,
  interpretWeatherCode,
} from '../shared/aqiUtils.ts';

describe('AQI Classification & Environmental Utilities', () => {
  it('classifies all US EPA AQI bands and exact boundaries with explicit non-color labels', () => {
    expect(classifyUsAqi(0).key).toBe('good');
    expect(classifyUsAqi(50).key).toBe('good');
    expect(classifyUsAqi(51).key).toBe('moderate');
    expect(classifyUsAqi(100).key).toBe('moderate');
    expect(classifyUsAqi(101).key).toBe('usg');
    expect(classifyUsAqi(150).key).toBe('usg');
    expect(classifyUsAqi(151).key).toBe('unhealthy');
    expect(classifyUsAqi(200).key).toBe('unhealthy');
    expect(classifyUsAqi(201).key).toBe('very_unhealthy');
    expect(classifyUsAqi(300).key).toBe('very_unhealthy');
    expect(classifyUsAqi(301).key).toBe('hazardous');
  });

  it('handles invalid or missing AQI values safely without NaN', () => {
    expect(classifyUsAqi(null).key).toBe('good');
    expect(classifyUsAqi(undefined).key).toBe('good');
    expect(classifyUsAqi(Number.NaN).key).toBe('good');
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

  it('calculates HEPA CADR recommendations, weather codes, and inversion risk properly', () => {
    const cadr = calculateRecommendedCadr(20);
    expect(cadr.cadrM3PerHour).toBeGreaterThan(200);
    expect(cadr.cadrCfm).toBeGreaterThan(100);
    expect(calculateRecommendedCadr(1).cadrM3PerHour).toBe(calculateRecommendedCadr(5).cadrM3PerHour);
    expect(assessInversionRisk(null, 8)).toBe('unknown');
    expect(assessInversionRisk(4, 8)).toBe('high');
    expect(assessInversionRisk(10, 12)).toBe('moderate');
    expect(assessInversionRisk(18, 12)).toBe('low');
    expect(interpretWeatherCode(0)).toBe('Clear sky');
    expect(interpretWeatherCode(45)).toBe('Winter fog / mist');
    expect(interpretWeatherCode(undefined)).toBe('Conditions unavailable');
  });
});
