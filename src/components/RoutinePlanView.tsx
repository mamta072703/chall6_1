import React from 'react';
import type { DailyRoutinePlan } from '../shared/types.ts';
import { ImpactExplainerCard } from './ImpactExplainerCard.tsx';

export const RoutinePlanView: React.FC<{ routinePlan: DailyRoutinePlan }> = ({ routinePlan }) => (
  <div className="space-y-6">
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h3 className="text-lg font-display font-semibold text-slate-900">{routinePlan.headline}</h3>
      <p className="text-sm text-slate-700">{routinePlan.isSafeOutsideSummary}</p>
      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
        <strong>Sensitive Group Precautions:</strong> {routinePlan.sensitiveGroupPrecautions}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {routinePlan.blocks.map((block) => (
        <div key={block.period} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-xs font-medium text-teal-800">{block.period}</p>
            <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
              {block.recommendedWindow}
            </h4>
          </div>
          <p className="text-xs text-slate-700">{block.summary}</p>
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <p>
              <strong className="text-slate-800">Outdoor:</strong> {block.outdoorSafety}
            </p>
            <p>
              <strong className="text-slate-800">Indoor:</strong> {block.indoorAction}
            </p>
            <p>
              <strong className="text-slate-800">Commute / Energy:</strong> {block.commuteOrEnergyTip}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      <h3 className="text-base font-display font-semibold text-slate-900">
        Environmental Impact Breakdown
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {routinePlan.impactBreakdowns.map((item) => (
          <div key={item.actionTitle} className="bg-white border border-slate-200 rounded-xl p-4">
            <ImpactExplainerCard impact={item} />
          </div>
        ))}
      </div>
    </div>

    <p className="text-xs text-slate-500">{routinePlan.disclaimer}</p>
  </div>
);
