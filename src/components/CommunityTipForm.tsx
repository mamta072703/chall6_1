import React from 'react';
import type { CommunityTip } from '../shared/types.ts';

interface CommunityTipFormProps {
  tipCategory: CommunityTip['category'];
  tipCost: string;
  tipTitle: string;
  tipBody: string;
  submittingTip: boolean;
  onCategoryChange: (category: CommunityTip['category']) => void;
  onCostChange: (cost: string) => void;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CommunityTipForm: React.FC<CommunityTipFormProps> = ({
  tipCategory,
  tipCost,
  tipTitle,
  tipBody,
  submittingTip,
  onCategoryChange,
  onCostChange,
  onTitleChange,
  onBodyChange,
  onCancel,
  onSubmit,
}) => (
  <form
    onSubmit={onSubmit}
    className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label htmlFor="tip-category" className="block text-xs text-slate-600 mb-1">
          Category
        </label>
        <select
          id="tip-category"
          value={tipCategory}
          onChange={(e) => onCategoryChange(e.target.value as CommunityTip['category'])}
          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
        >
          <option value="indoor_air">Indoor Air</option>
          <option value="clean_commute">Clean Commute</option>
          <option value="energy_saving">Energy Saving</option>
          <option value="waste_reduction">Waste Reduction</option>
        </select>
      </div>
      <div>
        <label htmlFor="tip-cost" className="block text-xs text-slate-600 mb-1">
          Estimated Cost
        </label>
        <input
          id="tip-cost"
          type="text"
          value={tipCost}
          onChange={(e) => onCostChange(e.target.value)}
          placeholder="Free / Low cost ($5)"
          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
        />
      </div>
    </div>
    <div>
      <label htmlFor="tip-title" className="block text-xs text-slate-600 mb-1">
        Tip Headline
      </label>
      <input
        id="tip-title"
        type="text"
        required
        value={tipTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="e.g., Damp towel draft blocker under apartment main door"
        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
      />
    </div>
    <div>
      <label htmlFor="tip-body" className="block text-xs text-slate-600 mb-1">
        Practical Details (do not include personal names or addresses)
      </label>
      <textarea
        id="tip-body"
        rows={3}
        required
        value={tipBody}
        onChange={(e) => onBodyChange(e.target.value)}
        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
      />
    </div>
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-md min-h-[36px]"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submittingTip}
        className="px-3.5 py-1.5 text-xs bg-teal-700 text-white rounded-md hover:bg-teal-800 disabled:opacity-50 min-h-[36px]"
      >
        {submittingTip ? 'Publishing...' : 'Publish Tip'}
      </button>
    </div>
  </form>
);
