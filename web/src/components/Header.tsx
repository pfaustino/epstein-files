import React from 'react';
import { Network, LayoutGrid, Route, BookOpen, Plane, Scale, ExternalLink, FileText } from 'lucide-react';
import { ViewMode, ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalPeople: number;
  totalFiltered: number;
  blackBookCount: number;
  flightsCount: number;
  doesCount: number;
  eftaReportsCount?: number;
  onOpenPathFinder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  totalPeople,
  totalFiltered,
  blackBookCount,
  flightsCount,
  doesCount,
  eftaReportsCount = 201,
  onOpenPathFinder,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0d1017]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 z-20 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Brand & Active Tab Metadata */}
      <div className="flex items-center justify-between md:justify-start gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            {activeTab === 'core' && <Network className="w-5 h-5 text-white" />}
            {activeTab === 'black_book' && <BookOpen className="w-5 h-5 text-amber-300" />}
            {activeTab === 'flights' && <Plane className="w-5 h-5 text-sky-300" />}
            {activeTab === 'court_does' && <Scale className="w-5 h-5 text-rose-300" />}
            {activeTab === 'efta_reports' && <FileText className="w-5 h-5 text-emerald-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                EPSTEIN NETWORK
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-medium">
                  EXPLORER
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              {activeTab === 'core' && (
                <>
                  <span>Core Investigative Dossiers</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-cyan-400">{totalFiltered} / {totalPeople} Individuals</span>
                </>
              )}
              {activeTab === 'black_book' && (
                <>
                  <span>Epstein's Address Book</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-amber-400">{blackBookCount.toLocaleString()} Directory Contacts</span>
                </>
              )}
              {activeTab === 'flights' && (
                <>
                  <span>Pilot Flight Logs & Manifests</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-sky-400">{flightsCount} Recorded Flight Legs</span>
                </>
              )}
              {activeTab === 'court_does' && (
                <>
                  <span>Giuffre v. Maxwell Unsealed Does</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-rose-400">{doesCount} Does (1–187)</span>
                </>
              )}
              {activeTab === 'efta_reports' && (
                <>
                  <span>DOJ EFTA Forensic Reports & Releases</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-emerald-400">{eftaReportsCount} Reports • 12 DOJ Datasets</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* External Link on Mobile */}
        <a
          href="https://en.wikipedia.org/wiki/List_of_people_named_in_the_Epstein_files"
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-cyan-400 bg-slate-900/60"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Primary Tab Navigation & View Mode Sub-Controls */}
      <div className="flex items-center flex-wrap gap-2 justify-between md:justify-end">
        {/* 5 Primary Navigation Tabs */}
        <div className="flex items-center flex-wrap bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
          {/* Tab 1: Core Network */}
          <button
            onClick={() => setActiveTab('core')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'core'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Core Network</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'core' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalPeople}
            </span>
          </button>

          {/* Tab 2: Black Book */}
          <button
            onClick={() => setActiveTab('black_book')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'black_book'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Black Book</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'black_book' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {blackBookCount.toLocaleString()}
            </span>
          </button>

          {/* Tab 3: Flight Logs */}
          <button
            onClick={() => setActiveTab('flights')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'flights'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flight Logs</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'flights' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {flightsCount}
            </span>
          </button>

          {/* Tab 4: Court Does */}
          <button
            onClick={() => setActiveTab('court_does')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'court_does'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Court Does</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'court_does' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {doesCount}
            </span>
          </button>

          {/* Tab 5: EFTA Archives */}
          <button
            onClick={() => setActiveTab('efta_reports')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'efta_reports'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>EFTA Archives</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'efta_reports' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {eftaReportsCount}
            </span>
          </button>
        </div>

        {/* View Mode Switcher (Visible in Core Network Tab) */}
        {activeTab === 'core' && (
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'graph'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Graph</span>
            </button>

            <button
              onClick={() => setViewMode('directory')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'directory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={onOpenPathFinder}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-400 hover:text-white hover:bg-cyan-950/60 border border-cyan-800/40 ml-1 transition-all"
              title="Find shortest path of connection between any two people"
            >
              <Route className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Path</span>
            </button>
          </div>
        )}

        {/* External Link on Desktop */}
        <a
          href="https://en.wikipedia.org/wiki/List_of_people_named_in_the_Epstein_files"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-800/60 bg-slate-900/60 transition-colors shrink-0"
        >
          <span>Wiki Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
