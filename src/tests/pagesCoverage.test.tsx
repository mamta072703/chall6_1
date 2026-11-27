import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AirAwareProvider } from '../context/AirAwareContext.tsx';
import { AirExplorerPage } from '../pages/AirExplorerPage.tsx';
import { AssistantPage } from '../pages/AssistantPage.tsx';
import { CommunityPage } from '../pages/CommunityPage.tsx';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { SustainabilityPage } from '../pages/SustainabilityPage.tsx';
import * as apiClient from '../services/apiClient.ts';
import { classifyUsAqi } from '../shared/aqiUtils.ts';

vi.mock('../services/apiClient.ts', () => ({
  fetchAirQualitySnapshotApi: vi.fn(async ({ location }) => ({
    location,
    currentAqi: location.name === 'London' ? 42 : 184,
    europeanAqi: 82,
    classification: classifyUsAqi(location.name === 'London' ? 42 : 184),
    pollutants: { pm25: 94.1, pm10: 145.2, no2: 39.0, so2: 10.2, co: 750, o3: 27.4 },
    weather: {
      temperatureC: 11.4,
      humidityPercent: 74,
      windSpeedKmh: 4.1,
      surfacePressureHpa: 1018,
      weatherSummary: 'Winter mist',
      inversionRisk: 'high',
    },
    hourlyTrend: [
      { timeIso: '2026-11-16T08:00', label: '08:00', usAqi: 165, pm25: 88, pm10: 138 },
      { timeIso: '2026-11-16T09:00', label: '09:00', usAqi: 184, pm25: 94.1, pm10: 145.2 },
    ],
    dailySummary: 'Elevated winter particulate accumulation.',
    alerts: [
      {
        id: 'elevated-aqi-alert',
        severity: 'warning',
        title: 'Elevated Pollution Advisory',
        description: 'Sensitive groups should avoid vigorous outdoor exertion.',
        guidanceType: 'precaution',
        recommendedAction: 'Stay indoors during morning inversion.',
      },
    ],
    dataStatus: 'live',
    dataSource: 'Open-Meteo Copernicus CAMS',
    lastUpdatedIso: '2026-11-16T09:00:00.000Z',
  })),
  searchLocationsApi: vi.fn(async () => ({ results: [], source: 'open_meteo_geocoding' })),
  askAssistantApi: vi.fn(async () => ({
    answer: 'Keep windows sealed today and run kitchen exhaust while cooking.',
    impactCard: {
      actionTitle: 'Seal bedroom window gaps',
      whyItMatters: 'Cuts outdoor PM2.5 infiltration overnight.',
      pollutionSourceAddressed: 'Winter particulate smog',
      potentialEnvironmentalBenefit: 'Lowers indoor exposure peaks.',
      estimatedImpactRange: '15–35% indoor peak reduction',
      assumptionsAndUncertainty: 'Depends on window seal tightness.',
      difficulty: 'Easy',
      estimatedCost: 'Free – $8',
    },
    followUpSuggestions: ['How do I check door seals?'],
  })),
  generateDailyRoutineApi: vi.fn(async () => ({
    generatedAtIso: '2026-11-16T09:00:00.000Z',
    headline: 'Low-Exposure Winter Smog Schedule',
    isSafeOutsideSummary: 'Avoid prolonged vigorous outdoor exertion today.',
    sensitiveGroupPrecautions: 'Children and older adults should stay indoors.',
    blocks: [
      {
        period: 'Morning',
        recommendedWindow: '06:00–11:00',
        summary: 'Keep bedroom windows shut.',
        outdoorSafety: 'Wear fitted N95 on busy corridors.',
        indoorAction: 'Wet-wipe surfaces.',
        commuteOrEnergyTip: 'Take metro instead of petrol car.',
      },
    ],
    impactBreakdowns: [
      {
        actionTitle: 'Take metro instead of petrol car',
        whyItMatters: 'Eliminates cold-start exhaust.',
        pollutionSourceAddressed: 'Tailpipe NO2 & PM2.5',
        potentialEnvironmentalBenefit: 'Cuts roadside emissions.',
        estimatedImpactRange: '1.5–4.0 kg CO2e/day',
        assumptionsAndUncertainty: 'Varies by distance and occupancy.',
        difficulty: 'Easy',
        estimatedCost: 'Saves ~$3/day',
      },
    ],
    disclaimer: 'General guidance only.',
  })),
  fetchCommunityOverviewApi: vi.fn(async () => ({
    stats: {
      totalCleanCommuteDays: 410,
      totalIndoorProtectionActions: 920,
      totalEnergySavingActions: 315,
      activeHouseholdsParticipating: 140,
      methodologyNote: 'Aggregated anonymized counts.',
    },
    tips: [
      {
        id: 'tip-1',
        category: 'indoor_air',
        title: 'Damp towel under leaky door',
        body: 'Blocks hallway smog drafts overnight at zero cost.',
        estimatedCostLabel: 'Free',
        helpfulCount: 12,
        createdAtIso: '2026-11-16T08:00:00.000Z',
      },
    ],
    challenges: [
      {
        id: 'ch-transit',
        title: 'Clean Commute Week',
        description: 'Swap solo petrol trips for transit or walking.',
        durationLabel: '7 days',
        targetActions: 1000,
        participantsCount: 80,
        collectiveCompletions: 410,
      },
    ],
    campaigns: [],
  })),
  createCommunityTipApi: vi.fn(async (input) => ({
    id: 'tip-new',
    ...input,
    helpfulCount: 1,
    createdAtIso: '2026-11-16T09:10:00.000Z',
  })),
  markTipHelpfulApi: vi.fn(async () => ({
    id: 'tip-1',
    category: 'indoor_air',
    title: 'Damp towel under leaky door',
    body: 'Blocks hallway smog drafts overnight at zero cost.',
    estimatedCostLabel: 'Free',
    helpfulCount: 13,
    createdAtIso: '2026-11-16T08:00:00.000Z',
  })),
  recordChallengeActionApi: vi.fn(async () => ({
    id: 'ch-transit',
    title: 'Clean Commute Week',
    description: 'Swap solo petrol trips for transit or walking.',
    durationLabel: '7 days',
    targetActions: 1000,
    participantsCount: 81,
    collectiveCompletions: 410,
  })),
}));

function renderPage(ui: React.ReactElement) {
  return render(
    <AirAwareProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AirAwareProvider>
  );
}

describe('Core Workspace Pages Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders DashboardPage decision summary cards, alerts, and accessible checklist toggle', async () => {
    renderPage(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Is It Safe Outside Today\?/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Children, Seniors & Sensitive Groups/i)).toBeInTheDocument();
    expect(screen.getByText(/Elevated Pollution Advisory/i)).toBeInTheDocument();

    const checkBtns = screen.getAllByRole('button', { name: /Mark ".*" as completed/i });
    fireEvent.click(checkBtns[0]);
    expect(checkBtns[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches preset cities, metric tabs, and renders scoped hourly table in AirExplorerPage', async () => {
    renderPage(<AirExplorerPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'London' })).toBeInTheDocument();
    });

    const londonBtn = screen.getByRole('button', { name: 'London' });
    fireEvent.click(londonBtn);

    await waitFor(() => {
      expect(londonBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getAllByText(/42 US AQI/i).length).toBeGreaterThanOrEqual(1);
    });

    const pm25Tab = screen.getByRole('button', { name: 'PM2.5' });
    fireEvent.click(pm25Tab);
    expect(pm25Tab).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('columnheader', { name: 'Timestamp' })).toHaveAttribute('scope', 'col');
  });

  it('handles AI chat Q&A with Impact Explainer Card and Daily Routine generation in AssistantPage', async () => {
    renderPage(<AssistantPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Air Data/i })).not.toBeDisabled();
    });

    const input = screen.getByLabelText(/Ask AirAware AI a question/i);
    fireEvent.change(input, { target: { value: 'Is it safe outside today?' } });
    fireEvent.click(screen.getByRole('button', { name: /^Ask$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Keep windows sealed today and run kitchen exhaust/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Seal bedroom window gaps/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Generate Today’s Routine/i }));
    await waitFor(() => {
      expect(screen.getByText(/Low-Exposure Winter Smog Schedule/i)).toBeInTheDocument();
    });
    expect(apiClient.generateDailyRoutineApi).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'assistant-tab-routine');
  });

  it('updates SustainabilityPage commute estimator ranges and renders CommunityPage tips', async () => {
    const { unmount } = renderPage(<SustainabilityPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Air Data/i })).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/Baseline Mode/i), {
      target: { value: 'private_car_petrol' },
    });
    fireEvent.change(screen.getByLabelText(/Lower-Emission Alternative/i), {
      target: { value: 'walking' },
    });
    expect(screen.getByText(/±25% range/i)).toBeInTheDocument();
    unmount();

    renderPage(<CommunityPage />);
    await waitFor(() => {
      expect(screen.getByText(/Damp towel under leaky door/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Share Anonymized Tip/i }));
    fireEvent.change(screen.getByLabelText(/Tip Headline/i), {
      target: { value: 'Use foam tape on bedroom window tracks' },
    });
    fireEvent.change(screen.getByLabelText(/Practical Details/i), {
      target: { value: 'Apply EPDM foam tape around loose bedroom frames before winter inversion.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Publish Tip/i }));

    await waitFor(() => {
      expect(screen.getByText(/Use foam tape on bedroom window tracks/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mark tip "Damp towel under leaky door" helpful/i }));
    await waitFor(() => {
      expect(screen.getByText(/Helpful \(13\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Join Challenge/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Log Completed Action/i })).toBeInTheDocument();
    });
  });
});
