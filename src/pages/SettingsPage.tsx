import { Check, Download, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { HouseholdPreferencesForm } from '../components/HouseholdPreferencesForm.tsx';
import { LocationSearchWidget } from '../components/LocationSearchWidget.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import { createDefaultUserProfile } from '../shared/profileConstants.ts';
import type { UserProfile } from '../shared/types.ts';

export const SettingsPage: React.FC = () => {
  const {
    profile,
    updateProfile,
    regenerateActionsForCurrentAqi,
    resetAllLocalData,
  } = useAirAware();

  const [draft, setDraft] = useState<UserProfile>(profile);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (draft.concerns.length === 0) {
      setErrorMessage('Select at least one environmental concern before saving.');
      return;
    }
    updateProfile({
      ...draft,
      householdSize: Math.max(1, Math.min(20, Number(draft.householdSize) || 1)),
      onboardingCompleted: true,
    });
    regenerateActionsForCurrentAqi();
    setSavedMessage('Preferences saved and daily action plan updated.');
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const handleExportProfile = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airaware-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="User Profile & Settings"
      subtitle="Update household personalization, manage local storage privacy, and review data disclosures"
    >
      <div className="max-w-4xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6" noValidate>
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-display font-semibold text-slate-900">Active Location</h2>
            <p className="text-xs text-slate-600">
              Current: <strong className="text-slate-900">{draft.location.name}</strong> (
              {draft.location.latitude.toFixed(2)}, {draft.location.longitude.toFixed(2)})
            </p>
            <LocationSearchWidget
              currentLocation={draft.location}
              onSelectLocation={(loc) => setDraft((prev) => ({ ...prev, location: loc }))}
            />
          </section>

          <HouseholdPreferencesForm draft={draft} onChange={setDraft} idPrefix="settings" />

          {errorMessage && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {savedMessage ? (
              <p className="text-xs font-medium text-teal-800 flex items-center gap-1.5" role="status">
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{savedMessage}</span>
              </p>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 min-h-[44px]"
            >
              Save Preferences
            </button>
          </div>
        </form>

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-slate-900">
            Data Sources, Privacy &amp; Local Storage Controls
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Live AQI and meteorological observations are fetched via server-side proxy from Open-Meteo Copernicus CAMS Air Quality &amp; Weather APIs. Your household preferences, planner completion dates, and AI chat history are stored locally in your browser rather than published to community feeds.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export Preferences JSON</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-800 hover:bg-red-100 min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Local Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetAllLocalData();
                    setDraft(createDefaultUserProfile());
                    setConfirmReset(false);
                    setSavedMessage('Local profile and planner data reset.');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-red-700 text-white text-xs font-medium min-h-[40px]"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs min-h-[40px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
