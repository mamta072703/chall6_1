import { CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import type { ActionPlannerItem } from '../shared/types.ts';

export const ActionPlannerPage: React.FC = () => {
  const {
    profile,
    snapshot,
    actions,
    toggleActionComplete,
    addCustomAction,
    regenerateActionsForCurrentAqi,
  } = useAirAware();

  const [periodFilter, setPeriodFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customPeriod, setCustomPeriod] = useState<ActionPlannerItem['period']>('Morning');
  const [customCost, setCustomCost] = useState('Free');
  const [customBenefit, setCustomBenefit] = useState('');

  const filtered = actions.filter((a) => periodFilter === 'All' || a.period === periodFilter);
  const completedCount = actions.filter((a) => a.completed).length;
  const completionPct = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

  // Compute unique completion days across actions for weekly consistency tracking
  const uniqueActiveDays = new Set<string>();
  actions.forEach((a) => a.completedDates.forEach((d) => uniqueActiveDays.add(d)));

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTitle.trim().length < 4) return;
    addCustomAction({
      title: customTitle.trim(),
      period: customPeriod,
      category: 'indoor_air',
      priority: 'medium',
      estimatedCost: customCost.trim() || 'Free',
      environmentalBenefit:
        customBenefit.trim() || 'Custom household air protection or emission-reduction habit.',
      assumptionsNote: 'User-defined household action.',
    });
    setCustomTitle('');
    setCustomBenefit('');
    setShowAddForm(false);
  };

  return (
    <AppShell
      title="Daily Action Planner"
      subtitle={`Structured schedule for ${profile.location.name} (${snapshot?.currentAqi ?? '—'} US AQI)`}
    >
      <div className="space-y-6">
        {/* Progress Summary Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-xs text-slate-500">Today’s Completion</p>
            <p className="text-2xl font-display font-semibold text-slate-900 tabular-nums">
              {completedCount} / {actions.length} ({completionPct}%)
            </p>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-700 transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
            <p className="text-xs text-slate-500">Weekly Active Consistency</p>
            <p className="text-2xl font-display font-semibold text-slate-900 tabular-nums">
              {uniqueActiveDays.size} {uniqueActiveDays.size === 1 ? 'day' : 'days'} logged
            </p>
            <p className="text-xs text-slate-600">
              Tracks completed clean-air habits rather than vanity streak scores.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
            <p className="text-xs text-slate-600">
              Adapt actions whenever local AQI shifts or household budget changes.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={regenerateActionsForCurrentAqi}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 hover:bg-slate-100"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sync to Current AQI</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Action</span>
              </button>
            </div>
          </div>
        </section>

        {showAddForm && (
          <form
            onSubmit={handleAddCustom}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <h2 className="text-sm font-display font-semibold text-slate-900">
              Add Custom Household Action
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="custom-action-title" className="block text-xs text-slate-600 mb-1">
                  Action Title
                </label>
                <input
                  id="custom-action-title"
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Wipe down entryway shoes and coats after commute"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="custom-action-period" className="block text-xs text-slate-600 mb-1">
                  Time Block
                </label>
                <select
                  id="custom-action-period"
                  value={customPeriod}
                  onChange={(e) => setCustomPeriod(e.target.value as ActionPlannerItem['period'])}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="custom-action-cost" className="block text-xs text-slate-600 mb-1">
                  Estimated Cost
                </label>
                <input
                  id="custom-action-cost"
                  type="text"
                  value={customCost}
                  onChange={(e) => setCustomCost(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="custom-action-benefit" className="block text-xs text-slate-600 mb-1">
                  Expected Benefit
                </label>
                <input
                  id="custom-action-benefit"
                  type="text"
                  value={customBenefit}
                  onChange={(e) => setCustomBenefit(e.target.value)}
                  placeholder="Reduces tracked-in roadside dust indoors"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              >
                Save Action
              </button>
            </div>
          </form>
        )}

        {/* Filter Tabs */}
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg">
          {(['All', 'Morning', 'Afternoon', 'Evening'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setPeriodFilter(period)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                periodFilter === period
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                item.completed ? 'border-teal-200 bg-teal-50/30' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleActionComplete(item.id)}
                aria-pressed={item.completed}
                aria-label={`Toggle completion for ${item.title}`}
                className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  item.completed
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-white border-slate-300 hover:border-teal-600'
                }`}
              >
                {item.completed && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-800">{item.period}</span>
                  <span aria-hidden="true">·</span>
                  <span>Priority: {item.priority}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.estimatedCost}</span>
                </div>
                <h3
                  className={`text-sm sm:text-base font-medium ${
                    item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-xs text-slate-700">{item.environmentalBenefit}</p>
                <p className="text-[11px] text-slate-500">Assumptions: {item.assumptionsNote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};
