import { ArrowRight, Bot, CalendarCheck, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell.tsx';
import { AqiBadge, DataStatusNotice } from '../components/AqiBadge.tsx';
import {
  DecisionSummaryGrid,
  PollutantMetricsGrid,
  SafetyAlertsSection,
} from '../components/DashboardMetricsAndAlerts.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    snapshot,
    loadingSnapshot,
    snapshotError,
    actions,
    toggleActionComplete,
    routinePlan,
  } = useAirAware();

  const completedCount = actions.filter((a) => a.completed).length;

  return (
    <AppShell
      title="Environmental Dashboard"
      subtitle={`${profile.location.name} · Household size ${profile.householdSize} · ${profile.budget} budget tier`}
    >
      {snapshotError && (
        <div
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm"
          role="alert"
        >
          {snapshotError}
        </div>
      )}

      {loadingSnapshot && !snapshot ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
      ) : snapshot ? (
        <div className="space-y-6">
          {/* Primary AQI Hero Summary */}
          <section
            aria-label="Current Air Quality Overview"
            className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <AqiBadge classification={snapshot.classification} aqi={snapshot.currentAqi} />
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {snapshot.classification.rangeLabel}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-slate-900">
                  {snapshot.location.name}
                  {snapshot.location.country ? `, ${snapshot.location.country}` : ''}
                </h2>
                <p className="text-sm text-slate-700 max-w-3xl">{snapshot.dailySummary}</p>
                <DataStatusNotice
                  status={snapshot.dataStatus}
                  source={snapshot.dataSource}
                  lastUpdatedIso={snapshot.lastUpdatedIso}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 whitespace-nowrap min-h-[40px]"
                >
                  <Bot className="w-4 h-4" aria-hidden="true" />
                  <span>Generate Today’s AI Routine</span>
                </Link>
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 whitespace-nowrap min-h-[40px]"
                >
                  <span>Change City</span>
                </Link>
              </div>
            </div>

            <PollutantMetricsGrid snapshot={snapshot} />
          </section>

          <DecisionSummaryGrid snapshot={snapshot} profile={profile} />

          <SafetyAlertsSection alerts={snapshot.alerts} />

          {/* Two-Column Split: 24h Trend Chart + Today's Action Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-display font-semibold text-slate-900">
                    Recent 24-Hour AQI Trajectory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hourly US AQI trend showing inversion peaks and midday dispersion windows
                  </p>
                </div>
                <Link to="/explorer" className="text-xs font-medium text-teal-800 hover:text-teal-900 shrink-0">
                  Full Explorer
                </Link>
              </div>

              <p id="dashboard-aqi-chart-summary" className="sr-only">
                {(() => {
                  const vals = snapshot.hourlyTrend
                    .slice(-24)
                    .map((p) => p.usAqi)
                    .filter((v): v is number => typeof v === 'number');
                  if (vals.length === 0) return 'No hourly AQI points available.';
                  return `24-hour US AQI spans from a low of ${Math.min(...vals)} to a peak of ${Math.max(...vals)}, currently ${snapshot.currentAqi}.`;
                })()}
              </p>

              <div
                className="h-64 w-full"
                role="img"
                aria-label="24 hour US AQI trend chart"
                aria-describedby="dashboard-aqi-chart-summary"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshot.hourlyTrend.slice(-24)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v: string) => v.slice(6)}
                      minTickGap={24}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="usAqi"
                      name="US AQI"
                      stroke="#0f766e"
                      strokeWidth={2}
                      fill="#ccfbf1"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-display font-semibold text-slate-900">
                      Today’s Action Checklist
                    </h2>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {completedCount} of {actions.length} actions completed today
                    </p>
                  </div>
                  <Link
                    to="/planner"
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:text-teal-900"
                  >
                    <span>All Actions</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <ul className="divide-y divide-slate-100">
                  {actions.slice(0, 4).map((item) => (
                    <li key={item.id} className="py-2.5 flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActionComplete(item.id)}
                        aria-pressed={item.completed}
                        aria-label={`Mark "${item.title}" as ${item.completed ? 'incomplete' : 'completed'}`}
                        className="p-2 -m-2 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100/70 min-h-[44px] min-w-[44px]"
                      >
                        <span
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            item.completed
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {item.completed && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                        </span>
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-sm ${
                            item.completed ? 'line-through text-slate-500' : 'text-slate-800'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.period} · {item.estimatedCost}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-teal-700" aria-hidden="true" />
                  <span>
                    {routinePlan
                      ? 'AI routine active for today'
                      : 'Generate a personalized AI routine for today'}
                  </span>
                </span>
                <Link to="/assistant" className="font-medium text-teal-800 hover:text-teal-900">
                  Open
                </Link>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};
