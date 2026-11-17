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

export default function App() {
  return (
    <AirAwareProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AirAwareProvider>
  );
}
