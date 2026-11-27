/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AirAwareProvider } from './context/AirAwareContext.tsx';
import { LandingPage } from './pages/LandingPage.tsx';

// Code-split workspace routes for optimal initial bundle performance
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage.tsx').then((m) => ({ default: m.OnboardingPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage }))
);
const AirExplorerPage = lazy(() =>
  import('./pages/AirExplorerPage.tsx').then((m) => ({ default: m.AirExplorerPage }))
);
const AssistantPage = lazy(() =>
  import('./pages/AssistantPage.tsx').then((m) => ({ default: m.AssistantPage }))
);
const ActionPlannerPage = lazy(() =>
  import('./pages/ActionPlannerPage.tsx').then((m) => ({ default: m.ActionPlannerPage }))
);
const IndoorToolkitPage = lazy(() =>
  import('./pages/IndoorToolkitPage.tsx').then((m) => ({ default: m.IndoorToolkitPage }))
);
const SustainabilityPage = lazy(() =>
  import('./pages/SustainabilityPage.tsx').then((m) => ({ default: m.SustainabilityPage }))
);
const CommunityPage = lazy(() =>
  import('./pages/CommunityPage.tsx').then((m) => ({ default: m.CommunityPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage }))
);

const RouteFallback: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-sm text-slate-600">
    Loading AirAware AI workspace...
  </div>
);

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'An unexpected UI error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div
            role="alert"
            className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 space-y-3"
          >
            <h1 className="text-lg font-display font-semibold text-slate-900">
              Unable to render this view
            </h1>
            <p className="text-sm text-slate-600">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 min-h-[40px]"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AirAwareProvider>
      <BrowserRouter>
        <AppErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/explorer" element={<AirExplorerPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/planner" element={<ActionPlannerPage />} />
              <Route path="/indoor-toolkit" element={<IndoorToolkitPage />} />
              <Route path="/sustainability" element={<SustainabilityPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </BrowserRouter>
    </AirAwareProvider>
  );
}
