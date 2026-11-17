import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import React from 'react';
import type { AqiClassification, DataStatus } from '../shared/types.ts';

interface AqiBadgeProps {
  classification: AqiClassification;
  aqi: number;
  compact?: boolean;
}

/**
 * Accessible AQI severity indicator: always pairs color with an icon and explicit text label.
 */
export const AqiBadge: React.FC<AqiBadgeProps> = ({ classification, aqi, compact = false }) => {
  const Icon =
    classification.severityRank <= 2
      ? CheckCircle2
      : classification.severityRank === 3
        ? Info
        : classification.severityRank === 4
          ? AlertTriangle
          : ShieldAlert;

  return (
    <div
      className={`inline-flex items-center gap-2 border rounded-md px-2.5 py-1 text-xs font-medium ${classification.badgeClasses}`}
      role="status"
      aria-label={`Air quality index ${aqi}, category ${classification.label}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="tabular-nums font-mono font-semibold">{aqi} US AQI</span>
      {!compact && (
        <>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">{classification.label}</span>
        </>
      )}
    </div>
  );
};

export const DataStatusNotice: React.FC<{
  status: DataStatus;
  source: string;
  lastUpdatedIso: string;
}> = ({ status, source, lastUpdatedIso }) => {
  const formattedTime = (() => {
    try {
      return new Date(lastUpdatedIso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return lastUpdatedIso;
    }
  })();

  const statusText =
    status === 'live'
      ? 'Live measurement'
      : status === 'cached'
        ? 'Cached live reading'
        : 'Sample fallback baseline (not live)';

  return (
    <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-medium text-slate-800">{statusText}</span>
      <span aria-hidden="true">·</span>
      <span>{source}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">Updated {formattedTime}</span>
    </p>
  );
};
