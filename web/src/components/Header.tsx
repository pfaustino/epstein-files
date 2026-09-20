import React from 'react';
import { Network, LayoutGrid, Route, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalPeople: number;
  totalFiltered: number;
  onOpenPathFinder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  totalPeople,
  totalFiltered,
  onOpenPathFinder,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1017]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              EPSTEIN NETWORK
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-medium">
                KNOWLEDGE GRAPH
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Investigative Cross-Reference Explorer</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-cyan-400">{totalFiltered} / {totalPeople} Individuals</span>
          </p>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => setViewMode('graph')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'graph'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-4 h-4" />
          <span className="hidden sm:inline">Graph View</span>
        </button>

        <button
          onClick={() => setViewMode('directory')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'directory'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Directory Grid</span>
        </button>

        <button
          onClick={onOpenPathFinder}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 hover:text-white hover:bg-cyan-950/60 border border-cyan-800/40 ml-1 transition-all"
          title="Find shortest path of connection between any two people"
        >
          <Route className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">Path Finder</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-200 uppercase font-mono">Bacon #</span>
        </button>
      </div>

      {/* External Wiki Link */}
      <div className="flex items-center gap-2">
        <a
          href="https://en.wikipedia.org/wiki/List_of_people_named_in_the_Epstein_files"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-800/60 bg-slate-900/60 transition-colors"
        >
          <span>Wikipedia Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
