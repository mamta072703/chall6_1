import { ArrowRight, Check, ShieldCheck, Wind } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAirAware } from '../context/AirAwareContext.tsx';
import { AqiBadge } from '../components/AqiBadge.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';

export const LandingPage: React.FC = () => {
  const { profile, snapshot } = useAirAware();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:text-sm"
      >
        Skip to main content
      </a>
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <Wind className="w-5 h-5 text-teal-700" aria-hidden="true" />
            <span>AirAware AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600" aria-label="Main navigation">
            <a href="#capabilities" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <Link to="/explorer" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Air Explorer
            </Link>
            <Link to="/indoor-toolkit" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Indoor Toolkit
            </Link>
            <Link to="/community" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Community
            </Link>
          </nav>

          <div className="shrink-0">
            <Link
              to={profile.onboardingCompleted ? '/dashboard' : '/onboarding'}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <span>{profile.onboardingCompleted ? 'Open Dashboard' : 'Personalize Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Hero Split Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-xs font-medium text-slate-600 flex flex-wrap items-center gap-2">
                <span>Winter Smog &amp; Urban Air Intelligence</span>
                <span aria-hidden="true">·</span>
                <span>{profile.location.name}</span>
              </div>

              <h1
                className="font-display font-bold tracking-tight text-slate-900 leading-[1.12]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Practical daily guidance for breathing cleaner air through severe winter smog
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                AirAware AI combines live regional AQI telemetry with household-aware GenAI guidance to plan safer outdoor windows, low-cost indoor air protection, and lower-emission commutes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  to={profile.onboardingCompleted ? '/dashboard' : '/onboarding'}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors whitespace-nowrap min-h-[44px]"
                >
                  <span>{profile.onboardingCompleted ? 'View Your Daily Dashboard' : 'Set Up Household Profile'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[44px]"
                >
                  <span>Explore Live AQI</span>
                </Link>
              </div>

              {snapshot && (
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <AqiBadge classification={snapshot.classification} aqi={snapshot.currentAqi} />
                  <span>
                    PM2.5 {snapshot.pollutants.pm25?.toFixed(1) ?? 'N/A'} µg/m³ ·{' '}
                    {snapshot.dataStatus === 'sample_fallback' ? 'Sample baseline' : 'Live Open-Meteo feed'}
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <ResilientImage
                  src="/src/assets/images/hero_winter_smog_city_1794898229077.jpg"
                  alt="Modern urban neighborhood overlooking a misty winter valley at dawn"
                  fallbackTitle="Winter Urban Air Monitoring"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-column benchmark strip below hero split */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 pt-8">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-500">Air Quality Telemetry</p>
              <p className="mt-1 text-2xl font-display font-semibold text-slate-900 tabular-nums">
                US AQI &amp; PM2.5
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Live Copernicus CAMS &amp; weather feeds with explicit fallback labeling.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-500">GenAI Personalization</p>
              <p className="mt-1 text-2xl font-display font-semibold text-slate-900">
                Budget-Aware
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Tailors routines for low, medium, or high budgets and sensitive family members.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-500">Environmental Clarity</p>
              <p className="mt-1 text-2xl font-display font-semibold text-slate-900">
                Honest Ranges
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Every action explains pollution sources, assumptions, and uncertainty transparently.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-500">Community Privacy</p>
              <p className="mt-1 text-2xl font-display font-semibold text-slate-900">
                Zero Public PII
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Aggregated local clean-air challenges without exposing household locations.
              </p>
            </div>
          </div>
        </section>

        {/* Capabilities Asymmetric Grid */}
        <section id="capabilities" className="bg-white border-y border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-medium text-teal-800">Core System Capabilities</p>
              <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 tracking-tight">
                01. Actionable routines built around real pollution physics
              </h2>
              <p className="text-sm text-slate-600">
                Generic air alerts tell you the air is bad. AirAware AI translates particulate and weather dynamics into room-by-room protection and cleaner daily choices.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-500">02. Indoor Air Protection Toolkit</p>
                    <h3 className="text-xl font-display font-semibold text-slate-900">
                      Ventilation timing, HEPA sizing, and zero-cost dust control
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Calculate exact purifier CADR requirements for your bedroom area, know when to seal drafts vs. cross-ventilate, and see why houseplants cannot substitute for mechanical filtration.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                      <span>Room-by-room guidance for kitchen smoke and bedrooms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                      <span>Low-cost weatherstripping and wet-mopping checklists</span>
                    </li>
                  </ul>
                  <div>
                    <Link
                      to="/indoor-toolkit"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-800 hover:text-teal-900"
                    >
                      <span>Open Indoor Toolkit</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="min-h-[220px] bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/indoor_clean_living_1794898228133.jpg"
                    alt="Sunlit living room with a white cylindrical HEPA air purifier beside sealed windows"
                    fallbackTitle="Indoor HEPA Protection"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
                <div className="h-44 bg-slate-100">
                  <ResilientImage
                    src="/src/assets/images/clean_urban_commute_1794898228350.jpg"
                    alt="Electric tram and protected cycling lane on a winter city avenue"
                    fallbackTitle="Low-Emission Urban Commute"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">03. Sustainable Mobility &amp; Energy</p>
                    <h3 className="text-lg font-display font-semibold text-slate-900">
                      Lower-emission commute &amp; household shifts
                    </h3>
                    <p className="text-sm text-slate-600">
                      Compare realistic transport swaps and energy choices with transparent ±25% CO2e ranges and local exhaust context.
                    </p>
                  </div>
                  <Link
                    to="/sustainability"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-800 hover:text-teal-900"
                  >
                    <span>Explore Sustainability Tracker</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Health & Scientific Integrity Strip */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-slate-900 text-slate-100 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Responsible Public-Health Guidance</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-white">
                Extra precautions built in for children, seniors, and sensitive lungs
              </h2>
              <p className="text-sm text-slate-300">
                AirAware AI never diagnoses conditions or claims an activity is risk-free based solely on AQI. When thermal inversions trap PM2.5 overnight, routines automatically prioritize indoor clean-air recovery.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors whitespace-nowrap min-h-[44px]"
              >
                <span>Configure Family Profile</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            AirAware AI · Environmental intelligence for winter smog &amp; urban air quality. Not a substitute for medical advice.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link to="/assistant" className="hover:text-slate-900">
              AI Assistant
            </Link>
            <Link to="/planner" className="hover:text-slate-900">
              Action Planner
            </Link>
            <Link to="/community" className="hover:text-slate-900">
              Community Hub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
