import { AlertCircle, Bot, Send, Sparkles, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { AqiBadge } from '../components/AqiBadge.tsx';
import { ImpactExplainerCard } from '../components/ImpactExplainerCard.tsx';
import { RoutinePlanView } from '../components/RoutinePlanView.tsx';
import { useAirAware } from '../context/AirAwareContext.tsx';
import { askAssistantApi, generateDailyRoutineApi } from '../services/apiClient.ts';
import type { AssistantChatMessage } from '../shared/types.ts';

const STARTER_QUESTIONS = [
  'Is it safe for my family to go outside today, and what should we adjust in our daily routine?',
  'How can I improve indoor air quality at home on a tight budget without buying expensive purifiers?',
  'What is the cleanest way to commute today given current winter smog?',
  'What precautions should children and older adults follow during today’s pollution levels?',
];

function createClientMessageId(role: 'user' | 'assistant'): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${role}-${Date.now()}-${suffix}`;
}

export const AssistantPage: React.FC = () => {
  const {
    profile,
    snapshot,
    routinePlan,
    setRoutinePlan,
    chatHistory,
    setChatHistory,
  } = useAirAware();

  const [activeTab, setActiveTab] = useState<'chat' | 'routine'>('chat');
  const [questionInput, setQuestionInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSendQuestion = async (promptText?: string) => {
    const query = (promptText ?? questionInput).trim();
    if (!query || !snapshot || sendingChat) return;

    setAiError(null);
    const userMsg: AssistantChatMessage = {
      id: createClientMessageId('user'),
      role: 'user',
      content: query,
      timestampIso: new Date().toISOString(),
    };
    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    if (!promptText) setQuestionInput('');
    setSendingChat(true);

    try {
      const res = await askAssistantApi({
        question: query,
        history: chatHistory,
        profile,
        snapshot,
      });

      const assistantMsg: AssistantChatMessage = {
        id: createClientMessageId('assistant'),
        role: 'assistant',
        content: res.answer,
        timestampIso: new Date().toISOString(),
        impactCard: res.impactCard,
        followUpSuggestions: res.followUpSuggestions,
      };
      setChatHistory([...nextHistory, assistantMsg]);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AirAware AI right now.');
    } finally {
      setSendingChat(false);
    }
  };

  const handleGenerateRoutine = async () => {
    if (!snapshot || generatingRoutine) return;
    setAiError(null);
    setGeneratingRoutine(true);
    try {
      const plan = await generateDailyRoutineApi({ profile, snapshot });
      setRoutinePlan(plan);
      setActiveTab('routine');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate personalized daily routine.');
    } finally {
      setGeneratingRoutine(false);
    }
  };

  return (
    <AppShell
      title="GenAI Environmental Assistant"
      subtitle="Context-aware guidance grounded in live AQI, household needs, budget, and transparent impact assumptions"
    >
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {snapshot && (
              <AqiBadge classification={snapshot.classification} aqi={snapshot.currentAqi} />
            )}
            <span>
              {profile.location.name} · {profile.lifestyle.replace(/_/g, ' ')} ·{' '}
              {profile.budget} budget
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0" role="tablist" aria-label="Assistant modes">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg">
              <button
                id="assistant-tab-chat"
                type="button"
                role="tab"
                aria-selected={activeTab === 'chat'}
                aria-controls="assistant-panel-chat"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
                  activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Conversational Q&amp;A
              </button>
              <button
                id="assistant-tab-routine"
                type="button"
                role="tab"
                aria-selected={activeTab === 'routine'}
                aria-controls="assistant-panel-routine"
                onClick={() => setActiveTab('routine')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
                  activeTab === 'routine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Daily Routine Generator
              </button>
            </div>
          </div>
        </div>

        {aiError && (
          <div
            className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-sm flex items-start gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">AI Service Notice</p>
              <p className="text-xs mt-0.5">{aiError}</p>
            </div>
          </div>
        )}

        {activeTab === 'chat' ? (
          <div
            id="assistant-panel-chat"
            role="tabpanel"
            aria-labelledby="assistant-tab-chat"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[520px]">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-teal-700" aria-hidden="true" />
                  <h2 className="text-sm font-display font-semibold text-slate-900">
                    Personalized Environmental Advisor
                  </h2>
                </div>
                {chatHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setChatHistory([])}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear Session</span>
                  </button>
                )}
              </div>

              <div className="flex-1 p-5 space-y-5 overflow-y-auto max-h-[540px]" aria-live="polite">
                {chatHistory.length === 0 ? (
                  <div className="py-8 space-y-4">
                    <p className="text-sm text-slate-600">
                      Ask about today’s outdoor safety, low-cost indoor air fixes, cleaner commute routes, or precautions for children and seniors in{' '}
                      <strong className="text-slate-900">{profile.location.name}</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {STARTER_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => void handleSendQuestion(q)}
                          className="text-left p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 text-xs text-slate-800 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                        {msg.impactCard && <ImpactExplainerCard impact={msg.impactCard} />}
                      </div>

                      {msg.role === 'assistant' &&
                        msg.followUpSuggestions &&
                        msg.followUpSuggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.followUpSuggestions.map((sugg) => (
                              <button
                                key={sugg}
                                type="button"
                                onClick={() => void handleSendQuestion(sugg)}
                                className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-700"
                              >
                                {sugg}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))
                )}

                {sendingChat && (
                  <p className="text-xs text-teal-800 font-medium">
                    Analyzing local air quality and household profile...
                  </p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendQuestion();
                }}
                className="p-4 border-t border-slate-200 flex items-center gap-2.5"
              >
                <label htmlFor="ai-question-input" className="sr-only">
                  Ask AirAware AI a question
                </label>
                <input
                  id="ai-question-input"
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Ask a follow-up about air safety, indoor filtration, or commutes..."
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !questionInput.trim() || !snapshot}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap min-h-[42px]"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>Ask</span>
                </button>
              </form>
            </section>

            <aside className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Personalized Daily Routine
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate a structured Morning, Afternoon, and Evening schedule tailored to{' '}
                  {profile.location.name}’s current AQI and your {profile.budget}-budget profile.
                </p>
                <button
                  type="button"
                  onClick={() => void handleGenerateRoutine()}
                  disabled={generatingRoutine || !snapshot}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[42px]"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>{generatingRoutine ? 'Generating Routine...' : 'Generate Today’s Routine'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-5 space-y-2 text-xs">
                <p className="font-semibold text-white">Safety &amp; Scientific Boundaries</p>
                <p className="text-slate-300 leading-relaxed">
                  Guidance supports everyday exposure reduction and never replaces medical consultation. Vulnerable household members should follow clinician advice if respiratory symptoms occur.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <section
            id="assistant-panel-routine"
            role="tabpanel"
            aria-labelledby="assistant-tab-routine"
            className="space-y-5"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  AI-Generated Daily Routine Plan
                </h2>
                <p className="text-xs text-slate-600">
                  Adapts outdoor timing, ventilation windows, and commute choices to today’s conditions
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleGenerateRoutine()}
                disabled={generatingRoutine || !snapshot}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{generatingRoutine ? 'Generating...' : routinePlan ? 'Regenerate Plan' : 'Generate Plan'}</span>
              </button>
            </div>

            {routinePlan ? (
              <RoutinePlanView routinePlan={routinePlan} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <p className="text-sm text-slate-700">
                  No daily routine generated yet for today’s air quality snapshot.
                </p>
                <button
                  type="button"
                  onClick={() => void handleGenerateRoutine()}
                  disabled={generatingRoutine || !snapshot}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 min-h-[44px]"
                >
                  <span>Create Personalized Daily Routine</span>
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
};
