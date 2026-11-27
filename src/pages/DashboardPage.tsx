import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Droplets,
  Info,
  ShieldAlert,
  Thermometer,
  Wind,
} from 'lucide-react';
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

            {/* Key Pollutant & Weather Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">PM2.5</p>
                <p className="mt-1 text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {snapshot.pollutants.pm25 !== null ? `${snapshot.pollutants.pm25.toFixed(1)}` : 'N/A'}
                  <span className="text-xs font-normal text-slate-500 ml-1">µg/m³</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">PM10</p>
                <p className="mt-1 text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {snapshot.pollutants.pm10 !== null ? `${snapshot.pollutants.pm10.toFixed(1)}` : 'N/A'}
                  <span className="text-xs font-normal text-slate-500 ml-1">µg/m³</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">NO₂</p>
                <p className="mt-1 text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {snapshot.pollutants.no2 !== null ? `${snapshot.pollutants.no2.toFixed(1)}` : 'N/A'}
                  <span className="text-xs font-normal text-slate-500 ml-1">µg/m³</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Temp</span>
                </p>
                <p className="mt-1 text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {snapshot.weather.temperatureC !== null ? `${snapshot.weather.temperatureC.toFixed(1)}°C` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Wind</span>
                </p>
                <p className="mt-1 text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {snapshot.weather.windSpeedKmh !== null ? `${snapshot.weather.windSpeedKmh.toFixed(1)} km/h` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Humidity</span>
                </p>
                <p className="mt-1 text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {snapshot.weather.humidityPercent !== null ? `${snapshot.weather.humidityPercent}%` : 'N/A'}
                </p>
              </div>
            </div>
          </section>

          {/* Today's Household Decision Summary */}
          <section
            aria-label="Today's Household Decision Summary"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
              <h2 className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
                Is It Safe Outside Today?
              </h2>
              <p className="text-sm font-medium text-slate-900">{snapshot.classification.shortAction}</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {snapshot.classification.outdoorGuidance}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
              <h2 className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                Children, Seniors &amp; Sensitive Groups
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed">
                {snapshot.classification.sensitiveGroupGuidance}
              </p>
              {(profile.sensitiveGroups.children ||
                profile.sensitiveGroups.elderly ||
                profile.sensitiveGroups.pregnant ||
                profile.sensitiveGroups.respiratoryOrCardiac) && (
                <p className="text-[11px] font-medium text-amber-900 pt-1">
                  Active household precautions enabled for your sensitive-group profile.
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Indoor &amp; Commute Priority ({profile.budget} budget)
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {snapshot.classification.ventilationDirective === 'open_cross_ventilate'
                    ? 'Brief natural cross-ventilation is suitable right now; maintain low-emission travel habits.'
                    : 'Keep windows sealed during peak smog, vent kitchen cooking outdoors, and prefer low-emission transit.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-medium text-teal-800 pt-1">
                <Link to="/indoor-toolkit" className="hover:text-teal-950 underline-offset-2 hover:underline">
                  Indoor Toolkit
                </Link>
                <Link to="/sustainability" className="hover:text-teal-950 underline-offset-2 hover:underline">
                  Commute Impact
                </Link>
              </div>
            </div>
          </section>

          {/* Contextual Alerts & Safety Guidance */}
          {snapshot.alerts.length > 0 && (
            <section aria-label="Pollution and Safety Alerts" aria-live="polite" className="space-y-3">
              <h2 className="text-sm font-display font-semibold text-slate-900">
                Contextual Alerts &amp; Public-Health Guidance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {snapshot.alerts.map((alert) => {
                  const Icon =
                    alert.severity === 'critical'
                      ? ShieldAlert
                      : alert.severity === 'warning'
                        ? AlertTriangle
                        : Info;
                  const boxClass =
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200 text-red-950'
                      : alert.severity === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-white border-slate-200 text-slate-900';
                  return (
                    <div key={alert.id} className={`border rounded-xl p-4 space-y-1.5 ${boxClass}`}>
                      <div className="flex items-start gap-2.5">
                        <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold">{alert.title}</h3>
                          <p className="text-xs opacity-90">{alert.description}</p>
                          <p className="text-xs font-medium pt-1">
                            Action: {alert.recommendedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
