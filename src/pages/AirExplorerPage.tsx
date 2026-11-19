import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell.tsx';
import { AqiBadge, DataStatusNotice } from '../components/AqiBadge.tsx';
import { LocationSearchWidget } from '../components/LocationSearchWidget.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import type { LocationSelection } from '../shared/types.ts';

const PRESET_CITIES: LocationSelection[] = [
  { name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { name: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587 },
  { name: 'Milan', country: 'Italy', latitude: 45.4642, longitude: 9.19 },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Salt Lake City', country: 'United States', latitude: 40.7608, longitude: -111.891 },
];

export const AirExplorerPage: React.FC = () => {
  const { profile, snapshot, snapshotError, setLocation, loadingSnapshot } = useAirAware();
  const [chartMetric, setChartMetric] = useState<'usAqi' | 'pm25' | 'pm10'>('usAqi');

  const pollutantBars = snapshot
    ? [
        { name: 'PM2.5', value: snapshot.pollutants.pm25 ?? 0, unit: 'µg/m³' },
        { name: 'PM10', value: snapshot.pollutants.pm10 ?? 0, unit: 'µg/m³' },
        { name: 'NO₂', value: snapshot.pollutants.no2 ?? 0, unit: 'µg/m³' },
        { name: 'SO₂', value: snapshot.pollutants.so2 ?? 0, unit: 'µg/m³' },
        { name: 'O₃', value: snapshot.pollutants.o3 ?? 0, unit: 'µg/m³' },
      ]
    : [];

  return (
    <AppShell
      title="Air Quality Explorer"
      subtitle="Search global locations, inspect hourly winter inversion patterns, and compare major pollutants"
    >
      <div className="space-y-6">
        {snapshotError && (
          <div
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm"
            role="alert"
          >
            {snapshotError}
          </div>
        )}
        {/* Location Selection Panel */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-display font-semibold text-slate-900">
              Select Location or Enter Manual Coordinates
            </h2>
            <span className="text-xs text-slate-500">
              Active: {profile.location.name} ({profile.location.latitude.toFixed(2)},{' '}
              {profile.location.longitude.toFixed(2)})
            </span>
          </div>

          <LocationSearchWidget
            currentLocation={profile.location}
            onSelectLocation={(loc) => setLocation(loc)}
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 mr-1">Quick Switch:</span>
            {PRESET_CITIES.map((city) => {
              const active = city.name === profile.location.name;
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => setLocation(city)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        </section>

        {snapshot && (
          <>
            {/* Status Header */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <AqiBadge classification={snapshot.classification} aqi={snapshot.currentAqi} />
                    <span className="text-xs text-slate-600">
                      Ventilation directive:{' '}
                      <strong className="text-slate-900">
                        {snapshot.classification.ventilationDirective === 'open_cross_ventilate'
                          ? 'Open windows for brief cross-ventilation'
                          : snapshot.classification.ventilationDirective === 'brief_midday_only'
                            ? 'Short midday airing only (avoid traffic hours)'
                            : 'Keep windows closed & recirculate filtered air'}
                      </strong>
                    </span>
                  </div>
                  <DataStatusNotice
                    status={snapshot.dataStatus}
                    source={snapshot.dataSource}
                    lastUpdatedIso={snapshot.lastUpdatedIso}
                  />
                </div>
                {loadingSnapshot && (
                  <span className="text-xs text-teal-800 font-medium">Updating feed...</span>
                )}
              </div>
              <p className="text-sm text-slate-700">{snapshot.classification.outdoorGuidance}</p>
            </section>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-display font-semibold text-slate-900">
                      48-Hour Trend &amp; Forecast Curve
                    </h2>
                    <p className="text-xs text-slate-500">
                      Identify cleaner midday windows vs. nocturnal thermal inversion spikes
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                    {(
                      [
                        { key: 'usAqi', label: 'US AQI' },
                        { key: 'pm25', label: 'PM2.5' },
                        { key: 'pm10', label: 'PM10' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setChartMetric(tab.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          chartMetric === tab.key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-72 w-full" role="img" aria-label={`48 hour ${chartMetric} chart`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={snapshot.hourlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v: string) => v.slice(6)}
                        minTickGap={30}
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
                        dataKey={chartMetric}
                        name={chartMetric === 'usAqi' ? 'US AQI' : chartMetric.toUpperCase()}
                        stroke="#0f766e"
                        strokeWidth={2}
                        fill="#ccfbf1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <h2 className="text-base font-display font-semibold text-slate-900">
                    Major Pollutants (µg/m³)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Current atmospheric mix (CO excluded for scale: {snapshot.pollutants.co ?? 'N/A'} µg/m³)
                  </p>
                </div>
                <div className="h-72 w-full" role="img" aria-label="Major pollutants bar chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pollutantBars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Concentration (µg/m³)" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Hourly Table (Accessible Numeric Inspection) */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Recent Hourly Readings (Last 8 Hours)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4 font-medium">Timestamp</th>
                      <th className="py-2 px-4 font-medium text-right">US AQI</th>
                      <th className="py-2 px-4 font-medium text-right">PM2.5 (µg/m³)</th>
                      <th className="py-2 pl-4 font-medium text-right">PM10 (µg/m³)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshot.hourlyTrend.slice(-8).map((row) => (
                      <tr key={row.timeIso} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-4 font-mono tabular-nums text-slate-700">{row.label}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                          {row.usAqi ?? 'N/A'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {row.pm25?.toFixed(1) ?? 'N/A'}
                        </td>
                        <td className="py-2.5 pl-4 text-right font-mono tabular-nums text-slate-700">
                          {row.pm10?.toFixed(1) ?? 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
};
