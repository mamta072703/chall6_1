import { Check } from 'lucide-react';
import React from 'react';
import {
  BUDGET_OPTIONS,
  COMMUTE_OPTIONS,
  CONCERN_OPTIONS,
  LIFESTYLE_OPTIONS,
  OUTDOOR_OPTIONS,
  SENSITIVE_GROUP_OPTIONS,
} from '../shared/profileConstants.ts';
import type {
  CommuteMethod,
  LifestyleType,
  MainConcern,
  OutdoorActivityLevel,
  UserProfile,
} from '../shared/types.ts';

interface HouseholdPreferencesFormProps {
  draft: UserProfile;
  onChange: (updater: (prev: UserProfile) => UserProfile) => void;
  idPrefix: string;
}

/**
 * Shared accessible household preferences form used by both OnboardingPage and SettingsPage.
 */
export const HouseholdPreferencesForm: React.FC<HouseholdPreferencesFormProps> = ({
  draft,
  onChange,
  idPrefix,
}) => {
  const toggleConcern = (concern: MainConcern) => {
    onChange((prev) => {
      const exists = prev.concerns.includes(concern);
      const nextConcerns = exists
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern];
      return { ...prev, concerns: nextConcerns };
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <h2 className="text-base font-display font-semibold text-slate-900">
          Household, Lifestyle &amp; Commute
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`${idPrefix}-lifestyle`}
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Household / Lifestyle Profile
            </label>
            <select
              id={`${idPrefix}-lifestyle`}
              value={draft.lifestyle}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, lifestyle: e.target.value as LifestyleType }))
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
            <label
              htmlFor={`${idPrefix}-household-size`}
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Household Size (people)
            </label>
            <input
              id={`${idPrefix}-household-size`}
              type="number"
              min={1}
              max={20}
              value={draft.householdSize}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, householdSize: Number(e.target.value) }))
              }
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor={`${idPrefix}-commute`}
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Primary Daily Commute
            </label>
            <select
              id={`${idPrefix}-commute`}
              value={draft.commuteMethod}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, commuteMethod: e.target.value as CommuteMethod }))
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
            <label
              htmlFor={`${idPrefix}-outdoor`}
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Typical Daily Outdoor Activity
            </label>
            <select
              id={`${idPrefix}-outdoor`}
              value={draft.outdoorActivity}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  outdoorActivity: e.target.value as OutdoorActivityLevel,
                }))
              }
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg"
            >
              {OUTDOOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <h2 className="text-base font-display font-semibold text-slate-900">
          Budget Tier, Priorities &amp; Sensitive Groups
        </h2>

        <fieldset>
          <legend className="block text-xs font-medium text-slate-700 mb-2">
            Available Improvement Budget
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BUDGET_OPTIONS.map((item) => {
              const active = draft.budget === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange((prev) => ({ ...prev, budget: item.value }))}
                  className={`text-left p-3.5 rounded-lg border transition-colors min-h-[44px] ${
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
        </fieldset>

        <fieldset>
          <legend className="block text-xs font-medium text-slate-700 mb-2">
            Main Environmental Concerns (select one or more)
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CONCERN_OPTIONS.map((c) => {
              const selected = draft.concerns.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleConcern(c.value)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm text-left transition-colors min-h-[44px] ${
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
        </fieldset>

        <fieldset>
          <legend className="block text-xs font-medium text-slate-700 mb-2">
            Heightened Precaution Household Flags (Optional, stored locally only)
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            {SENSITIVE_GROUP_OPTIONS.map((flag) => (
              <label
                key={flag.key}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={draft.sensitiveGroups[flag.key]}
                  onChange={(e) =>
                    onChange((prev) => ({
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
        </fieldset>
      </section>
    </div>
  );
};
