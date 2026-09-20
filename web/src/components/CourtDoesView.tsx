import React, { useState, useMemo } from 'react';
import { Scale, Search, ShieldAlert, ShieldCheck, FileText, ExternalLink, Sparkles, Filter, Lock, Unlock, UserCheck } from 'lucide-react';
import { CourtDoesData, CourtDoeRecord } from '../types';

interface CourtDoesViewProps {
  data: CourtDoesData;
  onSelectCorePerson: (personId: string) => void;
}

export const CourtDoesView: React.FC<CourtDoesViewProps> = ({ data, onSelectCorePerson }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSEALED' | 'SEALED'>('ALL');
  const [coreOnly, setCoreOnly] = useState(false);

  // Filter Does
  const filteredDoes = useMemo(() => {
    return data.does.filter(doe => {
      // Core dossiers only
      if (coreOnly && !doe.has_core_dossier) {
        return false;
      }

      // Status filter
      if (statusFilter === 'UNSEALED' && doe.status.includes('Seal')) {
        return false;
      }
      if (statusFilter === 'SEALED' && !doe.status.includes('Seal')) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = doe.doe_number.toString() === q || `doe ${doe.doe_number}`.includes(q);
        const labelMatch = doe.doe_label.toLowerCase().includes(q);
        const nameMatch = doe.name.toLowerCase().includes(q);
        const roleMatch = doe.role.toLowerCase().includes(q);
        const rulingMatch = doe.ruling_summary.toLowerCase().includes(q);
        if (!numMatch && !labelMatch && !nameMatch && !roleMatch && !rulingMatch) {
          return false;
        }
      }

      return true;
    });
  }, [data.does, searchQuery, statusFilter, coreOnly]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a0f]">
      {/* Top Banner & Legal Context */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Court Does (1–187): Giuffre v. Maxwell Unsealing Index
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                187 Total Does
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                {data.metadata.unsealed_count} Unsealed
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                {data.metadata.sealed_count} Protected / Sealed
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Judicial index of pseudonymous individuals evaluated by U.S. District Judge Loretta A. Preska (Case No. 15-cv-07433-LAP, Doc 1320). Distinguishes unsealed associates and witnesses from legally protected minor victims.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCoreOnly(!coreOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                coreOnly
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Core Dossiers Only</span>
              <span className="text-[10px] px-1 rounded bg-black/40 font-mono">
                {data.metadata.matched_core_figures}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-3 flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Doe #, name, role, ruling..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Does ({data.metadata.total_does})
            </button>

            <button
              onClick={() => setStatusFilter('UNSEALED')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                statusFilter === 'UNSEALED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Unlock className="w-3 h-3 text-emerald-300" />
              <span>Unsealed ({data.metadata.unsealed_count})</span>
            </button>

            <button
              onClick={() => setStatusFilter('SEALED')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                statusFilter === 'SEALED'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Protected / Sealed ({data.metadata.sealed_count})</span>
            </button>
          </div>

          {/* Result counter */}
          <div className="text-xs text-slate-400 ml-auto font-mono">
            Showing {filteredDoes.length} of {data.does.length} Does
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredDoes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Scale className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Court Does match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try adjusting your search query or switching to "All Does".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDoes.map(doe => {
              const isSealed = doe.status.includes('Seal');
              return (
                <div
                  key={doe.id}
                  className={`bg-slate-900/90 rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5 ${
                    isSealed
                      ? 'border-amber-700/50 bg-gradient-to-b from-amber-950/20 to-slate-900/90'
                      : doe.has_core_dossier
                      ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 to-slate-900/90'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Doe Number & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-rose-300 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold">
                          #{doe.doe_number}
                        </span>
                        <div>
                          <h3 className="text-xs font-mono font-bold text-slate-400">
                            {doe.doe_label}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isSealed ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Sealed</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <Unlock className="w-2.5 h-2.5" />
                            <span>Unsealed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Identified Name */}
                    <div className="mb-2">
                      <div className="text-sm font-bold text-white tracking-tight">
                        {doe.name}
                      </div>
                    </div>

                    {/* Role Tag */}
                    <div className="mb-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {doe.role}
                      </span>
                    </div>

                    {/* Court Ruling Summary */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 mb-3 text-xs text-slate-300">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-rose-400" />
                        <span>Judicial Ruling Rationale:</span>
                      </div>
                      <p className="text-[11px] text-slate-300/90 leading-relaxed italic">
                        "{doe.ruling_summary}"
                      </p>
                    </div>

                    {/* Docket Metadata */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                      <span>Docket: {doe.docket_number}</span>
                      <span>Order: {doe.primary_order}</span>
                    </div>
                  </div>

                  {/* Footer / Cross-Link to Core Network */}
                  <div className="pt-3 border-t border-slate-800/80 mt-2">
                    {doe.has_core_dossier && doe.matched_person_id ? (
                      <button
                        onClick={() => onSelectCorePerson(doe.matched_person_id!)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:brightness-110 shadow-md shadow-rose-600/20 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>View Full Dossier in Core Network</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
                        <span>Judicial Record</span>
                        <span>Doc 1320</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
