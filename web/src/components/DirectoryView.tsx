import React, { useState, useMemo } from 'react';
import { Palmtree, Plane, Building2, Users, ArrowUpDown } from 'lucide-react';
import { PersonRecord, GraphNode } from '../types';
import { SECTOR_COLORS } from './FilterBar';

interface DirectoryViewProps {
  people: PersonRecord[];
  onSelectPerson: (node: GraphNode) => void;
  filteredIds: Set<string>;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  people,
  onSelectPerson,
  filteredIds,
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'connections' | 'citations'>('name');

  const visiblePeople = useMemo(() => {
    const list = people.filter(p => filteredIds.has(p.id));
    return list.sort((a, b) => {
      if (sortBy === 'connections') {
        return b.connected_individuals.length - a.connected_individuals.length;
      }
      if (sortBy === 'citations') {
        return b.citations_count - a.citations_count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [people, filteredIds, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#090a0f]">
      {/* Sorting / Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Directory Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Showing <span className="text-cyan-400 font-mono font-semibold">{visiblePeople.length}</span> individuals
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs">
          <span className="text-slate-400 pl-2 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </span>
          <button
            onClick={() => setSortBy('name')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              sortBy === 'name' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Name A-Z
          </button>
          <button
            onClick={() => setSortBy('connections')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              sortBy === 'connections' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Most Connected
          </button>
          <button
            onClick={() => setSortBy('citations')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              sortBy === 'citations' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Most Cited
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visiblePeople.map(p => {
          const sectorStyle = SECTOR_COLORS[p.sector] || {
            bg: 'bg-slate-800',
            text: 'text-slate-300',
            border: 'border-slate-700',
          };

          return (
            <div
              key={p.id}
              onClick={() =>
                onSelectPerson({
                  id: p.id,
                  label: p.name,
                  type: 'person',
                  sector: p.sector,
                  profession: p.profession_summary,
                  era: p.connection_to_epstein.era,
                  image: p.image_thumb,
                  wikipedia_url: p.wikipedia_url,
                  color: '#6366f1',
                  size: 20,
                  degree: p.connected_individuals.length,
                  bio: p.full_text,
                })
              }
              className="bg-[#0e111a] hover:bg-[#141926] border border-slate-800/80 hover:border-cyan-700/60 rounded-2xl p-4 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  {p.image_thumb ? (
                    <img
                      src={p.image_thumb}
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700 bg-slate-900 group-hover:border-cyan-500/60 transition-colors"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white group-hover:border-cyan-500/60 transition-colors">
                      {p.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {p.profession_summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span
                        className={`text-[9.5px] font-semibold px-2 py-0.2 rounded-full border truncate max-w-[150px] ${sectorStyle.bg} ${sectorStyle.text} ${sectorStyle.border}`}
                      >
                        {p.sector}
                      </span>

                      {/* Source Dataset Badge */}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          p.source_dataset === 'connections_article'
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                            : p.source_dataset === 'court_does_and_flights'
                            ? 'bg-purple-950/50 text-purple-300 border-purple-800/60'
                            : 'bg-blue-950/50 text-blue-300 border-blue-800/60'
                        }`}
                      >
                        {p.source_dataset === 'connections_article'
                          ? 'Connections'
                          : p.source_dataset === 'court_does_and_flights'
                          ? 'Court / Flights'
                          : 'Files List'}
                      </span>

                      {/* Legal Context Tag if specialized */}
                      {p.legal_context && p.legal_context !== 'Named in Files' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 border border-slate-700 truncate max-w-[140px]" title={p.legal_context}>
                          {p.legal_context}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Excerpt */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {p.full_text}
                </p>
              </div>

              {/* Card Footer Badges */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  {/* Island badge */}
                  {p.property_visits.island_status === 'Visited' && (
                    <span className="p-1 rounded bg-rose-950/80 text-rose-400 border border-rose-800" title="Visited Island">
                      <Palmtree className="w-3 h-3" />
                    </span>
                  )}
                  {/* Jet flight badge */}
                  {p.flight_logs.flew_on_private_plane && (
                    <span className="p-1 rounded bg-sky-950/80 text-sky-400 border border-sky-800" title="Flew on Private Jet">
                      <Plane className="w-3 h-3" />
                    </span>
                  )}
                  {/* Townhouse badge */}
                  {p.property_visits.townhouse_status === 'Visited' && (
                    <span className="p-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800" title="Visited Townhouse">
                      <Building2 className="w-3 h-3" />
                    </span>
                  )}
                  {/* Post-2008 badge */}
                  {p.connection_to_epstein.has_post_2008_ties && (
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/60 font-mono">
                      Post-2008
                    </span>
                  )}
                </div>

                {/* Mutual peers count */}
                <div className="flex items-center gap-1 text-slate-400 font-mono">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>{p.connected_individuals.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
