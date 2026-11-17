import { ArrowRight, Check, Wind } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LocationSearchWidget } from '../components/LocationSearchWidget.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import type {
  BudgetTier,
  CommuteMethod,
  LifestyleType,
  MainConcern,
  OutdoorActivityLevel,
  UserProfile,
} from '../shared/types.ts';

const COMMUTE_OPTIONS: Array<{ value: CommuteMethod; label: string }> = [
  { value: 'public_transit', label: 'Public Transit (Metro / Bus)' },
  { value: 'walking', label: 'Walking' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'carpool', label: 'Carpool / Shared Ride' },
  { value: 'private_car_petrol', label: 'Private Car (Petrol / Diesel)' },
  { value: 'electric_vehicle', label: 'Electric Vehicle' },
  { value: 'work_from_home', label: 'Work / Study from Home' },
];

const LIFESTYLE_OPTIONS: Array<{ value: LifestyleType; label: string }> = [
  { value: 'family_with_children', label: 'Family with Children' },
  { value: 'working_professional', label: 'Working Professional' },
  { value: 'student', label: 'Student' },
  { value: 'senior_household', label: 'Senior Household' },
  { value: 'mixed_multigenerational', label: 'Multigenerational Household' },
];

const CONCERN_OPTIONS: Array<{ value: MainConcern; label: string }> = [
  { value: 'indoor_air', label: 'Indoor Air Quality' },
  { value: 'outdoor_smog', label: 'Winter Smog & Outdoor Exposure' },
  { value: 'commuting', label: 'Cleaner Commuting' },
  { value: 'sustainability', label: 'Household Energy & Sustainability' },
];

export const OnboardingPage: React.FC = () => {
  const { profile, updateProfile, regenerateActionsForCurrentAqi } = useAirAware();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<UserProfile>({ ...profile });
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleConcern = (concern: MainConcern) => {
    setDraft((prev) => {
      const exists = prev.concerns.includes(concern);
      const nextConcerns = exists
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern];
      return { ...prev, concerns: nextConcerns };
    });
  };

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Location */}
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

          {/* 2. Household & Lifestyle */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-display font-semibold text-slate-900">
              2. Household, Lifestyle &amp; Commute
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lifestyle-select" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Household / Lifestyle Profile
                </label>
                <select
                  id="lifestyle-select"
                  value={draft.lifestyle}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, lifestyle: e.target.value as LifestyleType }))
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  {LIFESTYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="household-size" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Household Size (people)
                </label>
                <input
                  id="household-size"
                  type="number"
                  min={1}
                  max={20}
                  value={draft.householdSize}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, householdSize: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="commute-select" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Primary Daily Commute
                </label>
                <select
                  id="commute-select"
                  value={draft.commuteMethod}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, commuteMethod: e.target.value as CommuteMethod }))
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  {COMMUTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="outdoor-activity" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Typical Daily Outdoor Activity
                </label>
                <select
                  id="outdoor-activity"
                  value={draft.outdoorActivity}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      outdoorActivity: e.target.value as OutdoorActivityLevel,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg"
                >
                  <option value="low">Low (mostly indoors, short errands)</option>
                  <option value="moderate">Moderate (daily commute + 30–60 min outside)</option>
                  <option value="high">High (outdoor work, sports, or long walks)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. Budget & Concerns */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-display font-semibold text-slate-900">
              3. Budget Tier, Priorities &amp; Sensitive Groups
            </h2>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Available Improvement Budget
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Budget tier">
                {(
                  [
                    { value: 'low', title: 'Low Budget', desc: 'Free & DIY fixes first ($0–$20)' },
                    { value: 'medium', title: 'Medium Budget', desc: 'Selective HEPA & sealing ($25–$150)' },
                    { value: 'high', title: 'Flexible Budget', desc: 'Multi-room HEPA & clean upgrades' },
                  ] as Array<{ value: BudgetTier; title: string; desc: string }>
                ).map((item) => {
                  const active = draft.budget === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, budget: item.value }))}
                      className={`text-left p-3.5 rounded-lg border transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Main Environmental Concerns (select all that apply)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CONCERN_OPTIONS.map((c) => {
                  const selected = draft.concerns.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleConcern(c.value)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                        selected
                          ? 'border-teal-700 bg-teal-50 text-slate-900 font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{c.label}</span>
                      {selected && <Check className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Heightened Precaution Household Flags (Optional, stored locally only)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                {(
                  [
                    { key: 'children', label: 'Children under 12' },
                    { key: 'elderly', label: 'Adults aged 65+' },
                    { key: 'pregnant', label: 'Pregnant household member' },
                    { key: 'respiratoryOrCardiac', label: 'Asthma, COPD, or cardiac sensitivity' },
                  ] as const
                ).map((flag) => (
                  <label
                    key={flag.key}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={draft.sensitiveGroups[flag.key]}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          sensitiveGroups: {
                            ...prev.sensitiveGroups,
                            [flag.key]: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-teal-700 rounded"
                    />
                    <span className="text-slate-800">{flag.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {validationError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
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
