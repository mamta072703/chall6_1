import { ArrowRight, Wind } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HouseholdPreferencesForm } from '../components/HouseholdPreferencesForm.tsx';
import { LocationSearchWidget } from '../components/LocationSearchWidget.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import type { UserProfile } from '../shared/types.ts';

export const OnboardingPage: React.FC = () => {
  const { profile, updateProfile, regenerateActionsForCurrentAqi } = useAirAware();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<UserProfile>({ ...profile });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.location.name.trim()) {
      setValidationError('Please select or enter your city before continuing.');
      return;
    }
    if (draft.concerns.length === 0) {
      setValidationError('Select at least one priority focus area.');
      return;
    }
    const finalized: UserProfile = {
      ...draft,
      householdSize: Math.max(1, Math.min(20, Number(draft.householdSize) || 1)),
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    updateProfile(finalized);
    regenerateActionsForCurrentAqi();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-display font-bold text-slate-900 whitespace-nowrap"
          >
            <Wind className="w-5 h-5 text-teal-700" aria-hidden="true" />
            <span>AirAware AI</span>
          </Link>
          <Link to="/dashboard" className="text-xs font-medium text-slate-600 hover:text-slate-900">
            Skip to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-medium text-teal-800">Household Personalization</p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 tracking-tight">
            Tailor your air protection and daily sustainability plan
          </h1>
          <p className="text-sm text-slate-600">
            No personal identifiers, phone numbers, or street addresses are collected. Preferences stay private and can be updated anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900">
                1. City or Region
              </h2>
              <p className="text-xs text-slate-600">
                Selected location: <strong className="text-slate-900">{draft.location.name}</strong>{' '}
                ({draft.location.latitude.toFixed(2)}, {draft.location.longitude.toFixed(2)})
              </p>
            </div>
            <LocationSearchWidget
              currentLocation={draft.location}
              onSelectLocation={(loc) => setDraft((prev) => ({ ...prev, location: loc }))}
            />
          </section>

          <HouseholdPreferencesForm draft={draft} onChange={setDraft} idPrefix="onboarding" />

          {validationError && (
            <p
              id="onboarding-error"
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
              role="alert"
            >
              {validationError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors min-h-[44px]"
            >
              <span>Save Profile &amp; Open Dashboard</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
