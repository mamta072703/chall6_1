import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AqiBadge, DataStatusNotice } from '../components/AqiBadge.tsx';
import { IndoorToolkitPage } from '../pages/IndoorToolkitPage.tsx';
import { LandingPage } from '../pages/LandingPage.tsx';
import { classifyUsAqi } from '../shared/aqiUtils.ts';

vi.mock('../context/AirAwareContext.tsx', () => ({
  useAirAware: () => ({
    profile: {
      id: 'test-user',
      location: { name: 'Lahore', country: 'Pakistan', latitude: 31.52, longitude: 74.35 },
      commuteMethod: 'public_transit',
      householdSize: 4,
      lifestyle: 'family_with_children',
      outdoorActivity: 'moderate',
      budget: 'low',
      concerns: ['indoor_air', 'outdoor_smog'],
      sensitiveGroups: {
        children: true,
        elderly: false,
        pregnant: false,
        respiratoryOrCardiac: false,
      },
      onboardingCompleted: true,
      updatedAt: '2026-11-16T10:00:00.000Z',
    },
    snapshot: {
      location: { name: 'Lahore', country: 'Pakistan', latitude: 31.52, longitude: 74.35 },
      currentAqi: 185,
      europeanAqi: 86,
      classification: classifyUsAqi(185),
      pollutants: { pm25: 102.4, pm10: 162, no2: 44, so2: 12, co: 820, o3: 30 },
      weather: {
        temperatureC: 12,
        humidityPercent: 72,
        windSpeedKmh: 4.5,
        surfacePressureHpa: 1017,
        weatherSummary: 'Winter mist',
        inversionRisk: 'high',
      },
      hourlyTrend: [],
      dailySummary: 'Elevated winter particulate buildup.',
      alerts: [],
      dataStatus: 'live',
      dataSource: 'Open-Meteo Copernicus CAMS',
      lastUpdatedIso: '2026-11-16T10:00:00.000Z',
    },
    loadingSnapshot: false,
    snapshotError: null,
    actions: [],
    routinePlan: null,
    chatHistory: [],
    joinedChallenges: [],
    refreshSnapshot: vi.fn(),
  }),
}));

describe('AirAware AI Frontend Components', () => {
  it('renders AqiBadge with both numeric reading and explicit category label', () => {
    render(<AqiBadge classification={classifyUsAqi(185)} aqi={185} />);
    expect(screen.getByText(/185 US AQI/i)).toBeInTheDocument();
    expect(screen.getByText(/Unhealthy/i)).toBeInTheDocument();
  });

  it('distinguishes sample fallback data clearly from live measurements', () => {
    render(
      <DataStatusNotice
        status="sample_fallback"
        source="Sample Winter Smog Baseline"
        lastUpdatedIso="2026-11-16T10:00:00.000Z"
      />
    );
    expect(screen.getByText(/Sample fallback baseline \(not live\)/i)).toBeInTheDocument();
  });

  it('renders LandingPage hero and navigation links cleanly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: /practical daily guidance for breathing cleaner air/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Dashboard/i })).toBeInTheDocument();
  });

  it('renders IndoorToolkitPage with CADR sizing and houseplant myth clarification', () => {
    render(
      <MemoryRouter>
        <IndoorToolkitPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/HEPA Purifier Sizing Calculator/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Scientific Clarification: Houseplants Cannot Replace Filtration/i)
    ).toBeInTheDocument();
  });
});
