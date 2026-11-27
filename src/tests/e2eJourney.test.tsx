import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AirAwareProvider } from '../context/AirAwareContext.tsx';
import { ActionPlannerPage } from '../pages/ActionPlannerPage.tsx';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { OnboardingPage } from '../pages/OnboardingPage.tsx';
import { SettingsPage } from '../pages/SettingsPage.tsx';
import { classifyUsAqi } from '../shared/aqiUtils.ts';

vi.mock('../services/apiClient.ts', () => ({
  fetchAirQualitySnapshotApi: vi.fn(async ({ location }) => ({
    location,
    currentAqi: 172,
    europeanAqi: 82,
    classification: classifyUsAqi(172),
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
      { timeIso: '2026-11-16T09:00', label: '09:00', usAqi: 172, pm25: 94.1, pm10: 145.2 },
    ],
    dailySummary: 'Elevated winter particulate accumulation.',
    alerts: [],
    dataStatus: 'live',
    dataSource: 'Open-Meteo Copernicus CAMS',
    lastUpdatedIso: '2026-11-16T09:00:00.000Z',
  })),
  searchLocationsApi: vi.fn(async () => ({ results: [], source: 'open_meteo_geocoding' })),
}));

function renderJourney(initialRoute: string) {
  return render(
    <AirAwareProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planner" element={<ActionPlannerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    </AirAwareProvider>
  );
}

describe('End-to-End User Journey & Keyboard Accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('completes onboarding personalization, navigates to Dashboard, and supports Escape on mobile menu', async () => {
    renderJourney('/onboarding');

    fireEvent.change(screen.getByLabelText(/Household Size/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('radio', { name: /Medium Budget/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Profile & Open Dashboard/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Environmental Dashboard/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Household size 5 · medium budget tier/i)).toBeInTheDocument();

    // Verify mobile drawer aria-expanded state and Escape key dismissal
    const openMenuBtn = screen.getByRole('button', { name: /Open navigation menu/i });
    expect(openMenuBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(openMenuBtn);
    expect(screen.getByRole('dialog', { name: /Mobile workspace navigation/i })).toBeInTheDocument();
    expect(openMenuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /Mobile workspace navigation/i })
      ).not.toBeInTheDocument();
    });
  });

  it('toggles action planner completion, adds a custom action, and resets profile in Settings', async () => {
    const { unmount } = renderJourney('/planner');

    await waitFor(() => {
      expect(screen.getByRole('progressbar', { name: /Daily action completion progress/i })).toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByRole('button', { name: /Toggle completion for/i });
    fireEvent.click(toggleButtons[0]);
    expect(toggleButtons[0]).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Add Action/i }));
    fireEvent.change(screen.getByLabelText(/Action Title/i), {
      target: { value: 'Wipe entryway floor mat after evening commute' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Action/i }));

    expect(
      screen.getByText(/Wipe entryway floor mat after evening commute/i)
    ).toBeInTheDocument();

    unmount();

    renderJourney('/settings');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Air Data/i })).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/Household Size/i), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Preferences/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Preferences saved/i);

    fireEvent.click(screen.getByRole('button', { name: /Reset Local Data/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Reset/i }));
    expect((screen.getByLabelText(/Household Size/i) as HTMLInputElement).value).toBe('3');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Air Data/i })).not.toBeDisabled();
    });
  });
});
