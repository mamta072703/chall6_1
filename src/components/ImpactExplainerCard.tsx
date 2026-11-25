import React from 'react';
import type { EnvironmentalImpactDetail } from '../shared/types.ts';

export const ImpactExplainerCard: React.FC<{ impact: EnvironmentalImpactDetail }> = ({
  impact,
}) => (
  <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-semibold text-slate-900">{impact.actionTitle}</p>
      <span className="text-slate-600">
        {impact.difficulty} · {impact.estimatedCost}
      </span>
    </div>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
      <div>
        <dt className="font-medium text-slate-500">Why it matters</dt>
        <dd className="mt-0.5">{impact.whyItMatters}</dd>
      </div>
      <div>
        <dt className="font-medium text-slate-500">Pollution source addressed</dt>
        <dd className="mt-0.5">{impact.pollutionSourceAddressed}</dd>
      </div>
      <div>
        <dt className="font-medium text-slate-500">Potential environmental benefit</dt>
        <dd className="mt-0.5">{impact.potentialEnvironmentalBenefit}</dd>
      </div>
      <div>
        <dt className="font-medium text-slate-500">Estimated impact &amp; uncertainty</dt>
        <dd className="mt-0.5">
          <span className="font-medium text-slate-900">{impact.estimatedImpactRange}</span> —{' '}
          {impact.assumptionsAndUncertainty}
        </dd>
      </div>
    </dl>
  </div>
);
