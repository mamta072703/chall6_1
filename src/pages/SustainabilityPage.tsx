import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import { estimateCommuteImpact } from '../shared/aqiUtils.ts';
import { COMMUTE_LABELS } from '../shared/profileConstants.ts';
import type { CommuteMethod } from '../shared/types.ts';

export const SustainabilityPage: React.FC = () => {
  const { profile, actions } = useAirAware();

  const [currentMode, setCurrentMode] = useState<CommuteMethod>(profile.commuteMethod);
  const [targetMode, setTargetMode] = useState<CommuteMethod>('public_transit');
  const [dailyKm, setDailyKm] = useState<number>(14);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(5);

  const estimate = estimateCommuteImpact(currentMode, targetMode, dailyKm, daysPerWeek);

  const categoryBreakdown = [
    {
      category: 'Indoor Air',
      completed: actions.filter((a) => a.category === 'indoor_air' && a.completed).length,
      total: actions.filter((a) => a.category === 'indoor_air').length,
    },
    {
      category: 'Commute',
      completed: actions.filter((a) => a.category === 'commute' && a.completed).length,
      total: actions.filter((a) => a.category === 'commute').length,
    },
    {
      category: 'Energy & Waste',
      completed: actions.filter((a) => a.category === 'energy_waste' && a.completed).length,
      total: actions.filter((a) => a.category === 'energy_waste').length,
    },
    {
      category: 'Outdoor Safety',
      completed: actions.filter((a) => a.category === 'outdoor_protection' && a.completed).length,
      total: actions.filter((a) => a.category === 'outdoor_protection').length,
    },
  ];

  return (
    <AppShell
      title="Sustainability & Impact Tracker"
      subtitle="Transparent transport & energy comparisons with explicit modeling assumptions"
    >
      <div className="space-y-6">
        {/* Commute Emission Estimator */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-display font-semibold text-slate-900">
              Commute Mode Switch Estimator
            </h2>
            <p className="text-xs text-slate-600">
              Estimates approximate weekly tailpipe/CO₂e ranges rather than claiming false single-decimal precision.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="current-commute" className="block text-xs font-medium text-slate-700 mb-1">
                Baseline Mode
              </label>
              <select
                id="current-commute"
                value={currentMode}
                onChange={(e) => setCurrentMode(e.target.value as CommuteMethod)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                {Object.entries(COMMUTE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target-commute" className="block text-xs font-medium text-slate-700 mb-1">
                Lower-Emission Alternative
              </label>
              <select
                id="target-commute"
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as CommuteMethod)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                {Object.entries(COMMUTE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="daily-km" className="block text-xs font-medium text-slate-700 mb-1">
                Round-Trip Distance (km/day)
              </label>
              <input
                id="daily-km"
                type="number"
                min={1}
                max={150}
                value={dailyKm}
                onChange={(e) => setDailyKm(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="days-week" className="block text-xs font-medium text-slate-700 mb-1">
                Commute Days / Week
              </label>
              <input
                id="days-week"
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Math.max(1, Math.min(7, Number(e.target.value))))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-xs text-slate-500">Estimated Weekly Reduction Range</p>
            <p className="text-xl font-display font-semibold text-teal-800 tabular-nums">
              {estimate.estimatedKgCo2eSavedRange}
            </p>
            <p className="text-xs text-slate-700">{estimate.pmExhaustReductionNote}</p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
              <strong>Methodology &amp; Uncertainty:</strong> {estimate.assumptions}
            </p>
          </div>
        </section>

        {/* Action Breakdown Chart + Household Energy/Waste Alternatives */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900">
                Action Planner Progress by Domain
              </h2>
              <p className="text-xs text-slate-500">
                Completed vs. planned daily actions across protection and emission-reduction categories
              </p>
            </div>
            <p id="sustainability-chart-summary" className="sr-only">
              Action planner progress by domain:{' '}
              {categoryBreakdown
                .map((c) => `${c.category}: ${c.completed} of ${c.total} completed`)
                .join('; ')}.
            </p>
            <div
              className="h-64 w-full"
              role="img"
              aria-label="Action completion by category bar chart"
              aria-describedby="sustainability-chart-summary"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Planned" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-display font-semibold text-slate-900">
              Practical Household Energy &amp; Waste Alternatives
            </h2>
            <div className="divide-y divide-slate-100 text-xs space-y-3">
              <div className="pt-1">
                <p className="font-semibold text-slate-900">
                  1. Stop open leaf, cardboard, or residential biomass burning
                </p>
                <p className="text-slate-600 mt-1">
                  Open winter fires emit concentrated PM2.5 and polycyclic aromatic hydrocarbons right at breathing height. Bag green waste for municipal composting or mulching.
                </p>
              </div>
              <div className="pt-3">
                <p className="font-semibold text-slate-900">
                  2. Seal draft gaps before turning up electric or gas space heaters
                </p>
                <p className="text-slate-600 mt-1">
                  Draft-proofing windows lowers winter heating electricity/gas load while simultaneously blocking outdoor PM2.5 infiltration.
                </p>
              </div>
              <div className="pt-3">
                <p className="font-semibold text-slate-900">
                  3. Combine errands and cold-weather vehicle trips
                </p>
                <p className="text-slate-600 mt-1">
                  Catalytic converters operate inefficiently in the first 3–5 minutes of winter driving; batching short errands cuts disproportionate cold-start emissions.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
};
