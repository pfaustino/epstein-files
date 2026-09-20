import React, { useState, useMemo } from 'react';
import { Search, Phone, MapPin, Mail, FileText, ExternalLink, Sparkles, Filter, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { BlackBookEntry, BlackBookData } from '../types';

interface BlackBookViewProps {
  data: BlackBookData;
  onSelectCorePerson: (personId: string) => void;
}

const CATEGORIES = [
  'All Categories',
  'Personal / Social Contact',
  'Commercial / Service',
  'Household & Staff',
  'Aviation & Travel',
  'Massage / Spa',
  'Politics & Government',
  'Royalty & Nobility',
  'Medical & Academic',
];

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

const PAGE_SIZE = 48;

export const BlackBookView: React.FC<BlackBookViewProps> = ({ data, onSelectCorePerson }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [coreOnly, setCoreOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return data.entries.filter(entry => {
      // Core dossier filter
      if (coreOnly && !entry.has_core_dossier) {
        return false;
      }

      // Letter filter
      if (selectedLetter !== 'ALL' && entry.first_letter !== selectedLetter) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All Categories' && entry.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = entry.name.toLowerCase().includes(q) || entry.raw_name.toLowerCase().includes(q);
        const phoneMatch = entry.phones.some(p => p.number.includes(q));
        const addrMatch = entry.addresses.some(a => a.toLowerCase().includes(q));
        const noteMatch = entry.notes.some(n => n.toLowerCase().includes(q));
        if (!nameMatch && !phoneMatch && !addrMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [data.entries, searchQuery, selectedLetter, selectedCategory, coreOnly]);

  // Reset page when filters change
  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, safePage]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a0f]">
      {/* Top Banner & Context Note */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Epstein's Address Book (The "Little Black Book")
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                {data.metadata.total_entries.toLocaleString()} Total Contacts
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {data.metadata.matched_core_figures} Linked Core Dossiers
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The 92–97 page personal phone directory seized and published in public archives. Inclusion indicates contact information recorded by Epstein or his assistants, not complicity or guilt.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCoreOnly(!coreOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                coreOnly
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
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
              placeholder="Search contact name, city, phone..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Result counter */}
          <div className="text-xs text-slate-400 ml-auto font-mono">
            Showing {paginatedEntries.length} of {filteredEntries.length} contacts
          </div>
        </div>

        {/* Alphabet Jump Bar */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => {
                setSelectedLetter(letter);
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all ${
                selectedLetter === letter
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {paginatedEntries.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Address Book contacts match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try clearing your search query or selecting "ALL" from the alphabetical jump bar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedEntries.map(entry => {
              return (
                <div
                  key={entry.id}
                  className={`bg-slate-900/90 rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 ${
                    entry.has_core_dossier
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/10 to-slate-900/90'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Name & Page Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                          {entry.name}
                        </h3>
                        {entry.raw_name !== entry.name && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            Orig: {entry.raw_name}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          p. {entry.page_number}
                        </span>
                      </div>
                    </div>

                    {/* Category Pill */}
                    <div className="mb-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                        {entry.category}
                      </span>
                    </div>

                    {/* Phone Numbers */}
                    {entry.phones.length > 0 && (
                      <div className="space-y-1 mb-2.5">
                        {entry.phones.slice(0, 3).map((ph, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                            <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{ph.number}</span>
                            {ph.type && ph.type !== 'phone' && (
                              <span className="text-[10px] text-slate-500">({ph.type})</span>
                            )}
                          </div>
                        ))}
                        {entry.phones.length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{entry.phones.length - 3} more phone numbers
                          </span>
                        )}
                      </div>
                    )}

                    {/* Addresses */}
                    {entry.addresses.length > 0 && (
                      <div className="space-y-1 mb-2.5">
                        {entry.addresses.slice(0, 2).map((addr, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{addr}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Handwritten / Formatting Notes */}
                    {entry.notes.length > 0 && (
                      <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 mb-2.5">
                        <div className="text-[10px] font-semibold text-amber-300 flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3" />
                          <span>Address Book Notes:</span>
                        </div>
                        <ul className="text-xs text-amber-100/90 space-y-0.5 italic">
                          {entry.notes.map((note, idx) => (
                            <li key={idx} className="line-clamp-2">
                              "{note}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer / Cross-Link to Core Network */}
                  <div className="pt-3 border-t border-slate-800/80 mt-2">
                    {entry.has_core_dossier && entry.matched_person_id ? (
                      <button
                        onClick={() => onSelectCorePerson(entry.matched_person_id!)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:brightness-110 shadow-md shadow-amber-600/20 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>View Full Dossier in Core Network</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Directory Entry</span>
                        <span className="font-mono">Section {entry.alphabetical_section}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Page <span className="font-mono text-white">{safePage}</span> of{' '}
            <span className="font-mono text-white">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 px-2 font-mono">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
