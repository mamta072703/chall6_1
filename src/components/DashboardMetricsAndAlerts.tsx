import { AlertTriangle, Droplets, Info, ShieldAlert, Thermometer, Wind } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import type { AirQualitySnapshot, SafetyAlert, UserProfile } from '../shared/types.ts';

export const PollutantMetricsGrid: React.FC<{ snapshot: AirQualitySnapshot }> = ({ snapshot }) => (
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
);

export const DecisionSummaryGrid: React.FC<{
  snapshot: AirQualitySnapshot;
  profile: UserProfile;
}> = ({ snapshot, profile }) => {
  const hasSensitive =
    profile.sensitiveGroups.children ||
    profile.sensitiveGroups.elderly ||
    profile.sensitiveGroups.pregnant ||
    profile.sensitiveGroups.respiratoryOrCardiac;

  return (
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
        {hasSensitive && (
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
  );
};

export const SafetyAlertsSection: React.FC<{ alerts: SafetyAlert[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;
  return (
    <section aria-label="Pollution and Safety Alerts" aria-live="polite" className="space-y-3">
      <h2 className="text-sm font-display font-semibold text-slate-900">
        Contextual Alerts &amp; Public-Health Guidance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
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
                  <p className="text-xs font-medium pt-1">Action: {alert.recommendedAction}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
