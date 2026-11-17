import {
  Activity,
  Bot,
  CalendarCheck,
  Compass,
  Home,
  LayoutDashboard,
  Leaf,
  Menu,
  RefreshCw,
  Settings,
  Users,
  Wind,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAirAware } from '../context/AirAwareContext.tsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explorer', label: 'Air Explorer', icon: Compass },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/planner', label: 'Action Planner', icon: CalendarCheck },
  { to: '/indoor-toolkit', label: 'Indoor Toolkit', icon: Home },
  { to: '/sustainability', label: 'Sustainability', icon: Leaf },
  { to: '/community', label: 'Community Hub', icon: Users },
  { to: '/settings', label: 'Profile & Settings', icon: Settings },
];

export const AppShell: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const { profile, snapshot, loadingSnapshot, refreshSnapshot } = useAirAware();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar (240px deep navy) */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-slate-900 text-slate-100 border-r border-slate-800"
        aria-label="Primary workspace navigation"
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white font-display font-semibold text-base tracking-tight whitespace-nowrap shrink-0"
          >
            <Wind className="w-5 h-5 text-teal-400" aria-hidden="true" />
            <span>AirAware AI</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {WORKSPACE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active City</span>
            <Link to="/onboarding" className="text-teal-400 hover:text-teal-300 font-medium">
              Personalize
            </Link>
          </div>
          <p className="font-medium text-white truncate">{profile.location.name}</p>
          {snapshot && (
            <p className="text-slate-400 tabular-nums">
              {snapshot.currentAqi} US AQI · {snapshot.classification.label}
            </p>
          )}
        </div>
      </aside>

      {/* Mobile drawer navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] bg-slate-900 text-slate-100 flex flex-col h-full z-50">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-white font-display font-semibold text-base whitespace-nowrap"
              >
                <Wind className="w-5 h-5 text-teal-400" aria-hidden="true" />
                <span>AirAware AI</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-300 hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
              {WORKSPACE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-teal-700 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb/Title on left, 1-2 clean actions on right */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-md min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                <Link to="/dashboard" className="hover:text-slate-900">
                  Workspace
                </Link>
                <span aria-hidden="true">/</span>
                <span className="truncate font-medium text-slate-700">{title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-xs text-slate-600 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void refreshSnapshot(true)}
              disabled={loadingSnapshot}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingSnapshot ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{loadingSnapshot ? 'Refreshing' : 'Refresh Air Data'}</span>
            </button>

            {location.pathname !== '/assistant' && (
              <Link
                to="/assistant"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ask AI Advisor</span>
              </Link>
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p>
              AirAware AI provides environmental guidance only and does not replace professional medical advice or emergency services.
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/" className="hover:text-slate-900">
                Home
              </Link>
              <Link to="/settings" className="hover:text-slate-900">
                Preferences &amp; Privacy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
