import { Check, Plus, ShieldCheck, ThumbsUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { CommunityTipForm } from '../components/CommunityTipForm.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import {
  createCommunityTipApi,
  fetchCommunityOverviewApi,
  markTipHelpfulApi,
  recordChallengeActionApi,
} from '../services/apiClient.ts';
import type {
  CommunityAggregateStats,
  CommunityCampaign,
  CommunityChallenge,
  CommunityTip,
} from '../shared/types.ts';

export const CommunityPage: React.FC = () => {
  const { joinedChallenges, markChallengeJoined } = useAirAware();

  const [stats, setStats] = useState<CommunityAggregateStats | null>(null);
  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [campaigns, setCampaigns] = useState<CommunityCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'all' | CommunityTip['category']>('all');
  const [showTipForm, setShowTipForm] = useState(false);
  const [tipCategory, setTipCategory] = useState<CommunityTip['category']>('indoor_air');
  const [tipTitle, setTipTitle] = useState('');
  const [tipBody, setTipBody] = useState('');
  const [tipCost, setTipCost] = useState('Free');
  const [submittingTip, setSubmittingTip] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityOverviewApi();
      setStats(data.stats);
      setTips(data.tips);
      setChallenges(data.challenges);
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load community data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const handleTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipTitle.trim().length < 6 || tipBody.trim().length < 12) {
      setError('Please enter a title (min 6 chars) and practical tip details (min 12 chars).');
      return;
    }
    setSubmittingTip(true);
    setError(null);
    try {
      const created = await createCommunityTipApi({
        category: tipCategory,
        title: tipTitle.trim(),
        body: tipBody.trim(),
        estimatedCostLabel: tipCost.trim() || 'Free',
      });
      setTips((prev) => [created, ...prev]);
      setTipTitle('');
      setTipBody('');
      setShowTipForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to share tip.');
    } finally {
      setSubmittingTip(false);
    }
  };

  const handleHelpful = async (tipId: string) => {
    try {
      const updated = await markTipHelpfulApi(tipId);
      setTips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record helpful vote right now.');
    }
  };

  const handleChallengeAction = async (challengeId: string) => {
    const isAlreadyJoined = joinedChallenges.includes(challengeId);
    try {
      const updated = await recordChallengeActionApi(challengeId, !isAlreadyJoined);
      if (!isAlreadyJoined) {
        markChallengeJoined(challengeId);
      }
      setChallenges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      const refreshed = await fetchCommunityOverviewApi();
      setStats(refreshed.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update challenge progress.');
    }
  };

  const visibleTips = tips.filter((t) => categoryFilter === 'all' || t.category === categoryFilter);

  return (
    <AppShell
      title="Community Impact Hub"
      subtitle="Privacy-conscious collective actions, challenges, and local clean-air campaigns"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs" role="alert">
            {error}
          </div>
        )}

        {/* Privacy Banner + Collective Stats */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Privacy by Design: Zero personal locations, emails, or household profiles are shared publicly</span>
            </div>
          </div>

          {loading && !stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Clean Commute Days</p>
                  <p className="mt-1 text-2xl font-display font-semibold text-slate-900 tabular-nums">
                    {stats.totalCleanCommuteDays.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Indoor Air Actions</p>
                  <p className="mt-1 text-2xl font-display font-semibold text-slate-900 tabular-nums">
                    {stats.totalIndoorProtectionActions.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Energy &amp; Zero-Burn Actions</p>
                  <p className="mt-1 text-2xl font-display font-semibold text-slate-900 tabular-nums">
                    {stats.totalEnergySavingActions.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Active Households</p>
                  <p className="mt-1 text-2xl font-display font-semibold text-slate-900 tabular-nums">
                    {stats.activeHouseholdsParticipating.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">{stats.methodologyNote}</p>
            </>
          ) : null}
        </section>

        {/* Active Community Challenges */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-slate-900">
              Collective Winter Clean-Air Challenges
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((ch) => {
              const joined = joinedChallenges.includes(ch.id);
              return (
                <div
                  key={ch.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-teal-800">
                      {ch.durationLabel} · Target {ch.targetActions} actions
                    </p>
                    <h3 className="text-base font-display font-semibold text-slate-900">{ch.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{ch.description}</p>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        {ch.participantsCount} households
                      </span>
                      <span>{ch.collectiveCompletions} completed actions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleChallengeAction(ch.id)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
                        joined
                          ? 'bg-teal-700 text-white hover:bg-teal-800'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {joined ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Log Completed Action</span>
                        </>
                      ) : (
                        <span>Join Challenge</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Community Tips + Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Household Pollution-Reduction Tips
                </h2>
                <p className="text-xs text-slate-500">
                  Practical, anonymized solutions shared without personal details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTipForm((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Share Anonymized Tip</span>
              </button>
            </div>

            {showTipForm && (
              <CommunityTipForm
                tipCategory={tipCategory}
                tipCost={tipCost}
                tipTitle={tipTitle}
                tipBody={tipBody}
                submittingTip={submittingTip}
                onCategoryChange={setTipCategory}
                onCostChange={setTipCost}
                onTitleChange={setTipTitle}
                onBodyChange={setTipBody}
                onCancel={() => setShowTipForm(false)}
                onSubmit={handleTipSubmit}
              />
            )}

            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Filter community tips by category">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'indoor_air', label: 'Indoor Air' },
                  { key: 'clean_commute', label: 'Commute' },
                  { key: 'energy_saving', label: 'Energy' },
                  { key: 'waste_reduction', label: 'Waste' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={categoryFilter === tab.key}
                  onClick={() => setCategoryFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
                    categoryFilter === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {visibleTips.map((tip) => (
                <article key={tip.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {tip.category.replace(/_/g, ' ')} · {tip.estimatedCostLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleHelpful(tip.id)}
                      aria-label={`Mark tip "${tip.title}" helpful (${tip.helpfulCount} helpful votes)`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 tabular-nums min-h-[36px]"
                    >
                      <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                      <span>Helpful ({tip.helpfulCount})</span>
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{tip.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tip.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Local Environmental Awareness Campaigns */}
          <aside className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="h-44 bg-slate-100">
                <ResilientImage
                  src="/src/assets/images/clean_urban_commute_1794898228350.jpg"
                  alt="Electric tram and urban bike path promoting clean winter commuting"
                  fallbackTitle="Community Clean Mobility"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-4">
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Community Awareness Campaigns
                </h2>
                <div className="space-y-4 divide-y divide-slate-100">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="pt-3 first:pt-0 space-y-2">
                      <p className="text-xs font-medium text-teal-800">{camp.focusArea}</p>
                      <h3 className="text-sm font-semibold text-slate-900">{camp.title}</h3>
                      <p className="text-xs text-slate-600">{camp.summary}</p>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                        {camp.actionSteps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};
