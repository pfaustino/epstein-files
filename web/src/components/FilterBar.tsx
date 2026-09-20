import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Palmtree, Plane, Building2, AlertTriangle, RotateCcw, User, ArrowRight } from 'lucide-react';
import { FilterState, PersonRecord } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sectorCounts: Record<string, number>;
  totalFiltered: number;
  totalPeople: number;
  allPeople: PersonRecord[];
  onSelectPerson: (person: PersonRecord) => void;
}

export const SECTOR_COLORS: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  'Politics, Government & Diplomacy': { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/50', activeBg: 'bg-blue-600 text-white' },
  'Finance, Business & Real Estate': { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/50', activeBg: 'bg-amber-600 text-white' },
  'Tech, Crypto & Venture Capital': { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/50', activeBg: 'bg-cyan-600 text-white' },
  'Academia, Science & Research': { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/50', activeBg: 'bg-emerald-600 text-white' },
  'Entertainment, Arts & Media': { bg: 'bg-pink-950/40', text: 'text-pink-400', border: 'border-pink-800/50', activeBg: 'bg-pink-600 text-white' },
  'Royalty & Aristocracy': { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/50', activeBg: 'bg-purple-600 text-white' },
  'Healthcare & Medicine': { bg: 'bg-teal-950/40', text: 'text-teal-400', border: 'border-teal-800/50', activeBg: 'bg-teal-600 text-white' },
  'Law, Law Enforcement & Legal Defense': { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700/60', activeBg: 'bg-slate-600 text-white' },
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  sectorCounts,
  totalFiltered,
  totalPeople,
  allPeople,
  onSelectPerson,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Autocomplete matching individuals
  const searchMatches = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return allPeople
      .filter(p => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchAliases = (p.aliases || []).some(a => a.toLowerCase().includes(q));
        const matchProf = p.profession_summary.toLowerCase().includes(q);
        const matchSector = p.sector.toLowerCase().includes(q);
        return matchName || matchAliases || matchProf || matchSector;
      })
      .slice(0, 6);
  }, [allPeople, filters.searchQuery]);

  const toggleSector = (sector: string) => {
    setFilters(prev => {
      const exists = prev.selectedSectors.includes(sector);
      return {
        ...prev,
        selectedSectors: exists
          ? prev.selectedSectors.filter(s => s !== sector)
          : [...prev.selectedSectors, sector],
      };
    });
  };

  const isFiltered =
    Boolean(filters.searchQuery) ||
    filters.selectedSectors.length > 0 ||
    filters.visitedIslandOnly ||
    filters.flewPlaneOnly ||
    filters.visitedTownhouseOnly ||
    filters.post2008Only;

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedSectors: [],
      visitedIslandOnly: false,
      flewPlaneOnly: false,
      visitedTownhouseOnly: false,
      post2008Only: false,
    });
    setIsDropdownOpen(false);
  };

  const handleSelectFromSearch = (person: PersonRecord) => {
    onSelectPerson(person);
    setFilters(prev => ({ ...prev, searchQuery: person.name }));
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-[#0e111a] border-b border-slate-800/80 p-3 lg:px-6 space-y-3 z-10 shrink-0">
      {/* Top row: Search input + Autocomplete + Quick Action Toggles */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input with Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search (e.g. Bill Gates, Trump, Prince Andrew...)"
            value={filters.searchQuery}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={e => {
              setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
              setIsDropdownOpen(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchMatches.length > 0) {
                handleSelectFromSearch(searchMatches[0]);
              }
            }}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, searchQuery: '' }));
                setIsDropdownOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0f131d] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-800 flex justify-between">
                <span>Matching Individuals</span>
                <span>Press Enter to select</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {searchMatches.map(person => (
                  <button
                    key={person.id}
                    onClick={() => handleSelectFromSearch(person)}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    {person.image_thumb ? (
                      <img
                        src={person.image_thumb}
                        alt={person.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {person.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                          {person.name}
                        </span>
                        {person.aliases && person.aliases.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({person.aliases[0]})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {person.profession_summary}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Attribute Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Island Filter */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, visitedIslandOnly: !prev.visitedIslandOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filters.visitedIslandOnly
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-rose-900/80 hover:text-rose-400'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5 text-rose-400" />
            <span>Visited Island</span>
          </button>

          {/* Private Plane / Jet */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, flewPlaneOnly: !prev.flewPlaneOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filters.flewPlaneOnly
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-sky-900/80 hover:text-sky-400'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-sky-400" />
            <span>Flew on Jet</span>
          </button>

          {/* NYC Townhouse */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, visitedTownhouseOnly: !prev.visitedTownhouseOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filters.visitedTownhouseOnly
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-amber-900/80 hover:text-amber-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>NYC Townhouse</span>
          </button>

          {/* Post-2008 Contact */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, post2008Only: !prev.post2008Only }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filters.post2008Only
                ? 'bg-amber-500 text-slate-950 font-semibold border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-amber-700/60 hover:text-amber-400'
            }`}
            title="Contacts maintained after the 2008 Florida conviction"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Post-2008 Ties Only</span>
          </button>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Sector Pill Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1">
          Sectors:
        </span>
        {Object.entries(SECTOR_COLORS).map(([sector, style]) => {
          const count = sectorCounts[sector] || 0;
          const isSelected = filters.selectedSectors.includes(sector);
          return (
            <button
              key={sector}
              onClick={() => toggleSector(sector)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                isSelected
                  ? style.activeBg
                  : `${style.bg} ${style.text} ${style.border} hover:brightness-125`
              }`}
            >
              <span>{sector}</span>
              <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-900/80 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
