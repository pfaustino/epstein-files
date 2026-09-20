import React, { useState, useMemo } from 'react';
import { Plane, Search, Calendar, Users, MapPin, ExternalLink, Sparkles, Filter, ChevronLeft, ChevronRight, UserCheck, Award } from 'lucide-react';
import { FlightManifestsData, FlightRecord, PassengerLeaderboardItem } from '../types';

interface FlightLogsViewProps {
  data: FlightManifestsData;
  onSelectCorePerson: (personId: string) => void;
}

type FlightSubView = 'manifests' | 'leaderboard';

const PAGE_SIZE = 30;

export const FlightLogsView: React.FC<FlightLogsViewProps> = ({ data, onSelectCorePerson }) => {
  const [subView, setSubView] = useState<FlightSubView>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [coreOnly, setCoreOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter flights for manifest table
  const filteredFlights = useMemo(() => {
    return data.flights.filter(fl => {
      // Core figures only filter
      if (coreOnly && !fl.passengers.some(p => p.has_core_dossier)) {
        return false;
      }

      // Route filter
      if (selectedRoute !== 'ALL') {
        const matchesRoute =
          fl.route.from.toLowerCase().includes(selectedRoute.toLowerCase()) ||
          fl.route.to.toLowerCase().includes(selectedRoute.toLowerCase()) ||
          fl.route.from_description.toLowerCase().includes(selectedRoute.toLowerCase()) ||
          fl.route.to_description.toLowerCase().includes(selectedRoute.toLowerCase());
        if (!matchesRoute) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dateMatch = fl.date.toLowerCase().includes(q);
        const tailMatch = fl.aircraft.tail_number.toLowerCase().includes(q);
        const routeMatch = fl.route.display.toLowerCase().includes(q);
        const passMatch = fl.passengers.some(p => p.name.toLowerCase().includes(q));
        const remarksMatch = fl.remarks.toLowerCase().includes(q);
        if (!dateMatch && !tailMatch && !routeMatch && !passMatch && !remarksMatch) {
          return false;
        }
      }

      return true;
    });
  }, [data.flights, searchQuery, selectedRoute, coreOnly]);

  // Filter passengers for leaderboard
  const filteredLeaderboard = useMemo(() => {
    return data.passengers_leaderboard.filter(p => {
      if (coreOnly && !p.has_core_dossier) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(q);
        const routeMatch = p.top_routes.some(r => r.route.toLowerCase().includes(q));
        const coMatch = p.top_co_passengers.some(cp => cp.name.toLowerCase().includes(q));
        if (!nameMatch && !routeMatch && !coMatch) return false;
      }
      return true;
    });
  }, [data.passengers_leaderboard, searchQuery, coreOnly]);

  // Pagination for flight manifests
  const totalFlightPages = Math.ceil(filteredFlights.length / PAGE_SIZE) || 1;
  const safeFlightPage = Math.min(currentPage, totalFlightPages);

  const paginatedFlights = useMemo(() => {
    const start = (safeFlightPage - 1) * PAGE_SIZE;
    return filteredFlights.slice(start, start + PAGE_SIZE);
  }, [filteredFlights, safeFlightPage]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a0f]">
      {/* Top Banner & KPI Summary Cards */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Pilot Flight Logs & Aviation Manifests
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                {data.metadata.total_flights} Recorded Flights
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {data.metadata.total_passengers_tracked} Unique Passengers
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Flight logs kept by pilots Dave Rodgers and Larry Visoski for Epstein's private aircraft (including Boeing 727 "Lolita Express" and Gulfstream jets).
            </p>
          </div>

          {/* Sub-view Switcher & Core Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSubView('leaderboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  subView === 'leaderboard'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Passenger Leaderboard</span>
              </button>

              <button
                onClick={() => setSubView('manifests')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  subView === 'manifests'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Flight Manifests</span>
              </button>
            </div>

            <button
              onClick={() => setCoreOnly(!coreOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                coreOnly
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Core Figures Only</span>
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
              placeholder={
                subView === 'leaderboard'
                  ? 'Search passenger name, route...'
                  : 'Search flight date, tail #, passenger...'
              }
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Route Filter Dropdown (for Manifests) */}
          {subView === 'manifests' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedRoute}
                onChange={e => {
                  setSelectedRoute(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="ALL">All Airports & Routes</option>
                <option value="TIST">St. Thomas / Little St. James (TIST)</option>
                <option value="PBI">Palm Beach (PBI)</option>
                <option value="TEB">Teterboro / NYC Area (TEB)</option>
                <option value="SAF">Santa Fe / Zorro Ranch (SAF)</option>
                <option value="LFPB">Paris-Le Bourget (LFPB)</option>
              </select>
            </div>
          )}

          {/* Result counter */}
          <div className="text-xs text-slate-400 ml-auto font-mono">
            {subView === 'leaderboard'
              ? `Showing ${filteredLeaderboard.length} of ${data.passengers_leaderboard.length} passengers`
              : `Showing ${paginatedFlights.length} of ${filteredFlights.length} flights`}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {subView === 'leaderboard' ? (
          /* --- Sub-View 1: Passenger Leaderboard --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeaderboard.map((item, rank) => (
              <div
                key={item.name}
                className={`bg-slate-900/90 rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 ${
                  item.has_core_dossier
                    ? 'border-sky-500/40 bg-gradient-to-b from-sky-950/20 to-slate-900/90'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Rank & Name */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold">
                        #{rank + 1}
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-tight">{item.name}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60">
                        {item.flight_count} {item.flight_count === 1 ? 'Flight' : 'Flights'}
                      </span>
                    </div>
                  </div>

                  {/* Flight Date Span */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-3">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {item.first_flight || 'Undated'} ➔ {item.last_flight || 'Undated'}
                    </span>
                  </div>

                  {/* Aircraft Flown */}
                  {item.aircraft_flown.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        Aircraft Tail Numbers:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.aircraft_flown.map(tail => (
                          <span
                            key={tail}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {tail}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Routes */}
                  {item.top_routes.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        Frequent Flight Legs:
                      </div>
                      <div className="space-y-1">
                        {item.top_routes.map((r, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80"
                          >
                            <span className="font-mono">{r.route}</span>
                            <span className="font-mono text-[11px] text-sky-400">
                              {r.count}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Co-Passengers */}
                  {item.top_co_passengers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        Flew With:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.top_co_passengers.map((cp, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/60"
                          >
                            {cp.name} ({cp.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Link to Core Network */}
                <div className="pt-3 border-t border-slate-800/80 mt-2">
                  {item.has_core_dossier && item.matched_person_id ? (
                    <button
                      onClick={() => onSelectCorePerson(item.matched_person_id!)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:brightness-110 shadow-md shadow-sky-600/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>View Full Dossier in Core Network</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
                      <span>Logged Passenger</span>
                      <span>{item.flight_count} Entries</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- Sub-View 2: Flight Manifests Table --- */
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Aircraft</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Passengers Recorded</th>
                    <th className="py-3 px-4">Remarks / Log Note</th>
                    <th className="py-3 px-4 text-right">Log Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paginatedFlights.map(fl => (
                    <tr key={fl.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-sky-400 whitespace-nowrap">
                        {fl.date || 'Undated'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-white">{fl.aircraft.tail_number}</div>
                        {fl.aircraft.make_model && (
                          <div className="text-[10px] text-slate-400">{fl.aircraft.make_model}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-white flex items-center gap-1.5">
                          <span>{fl.route.from}</span>
                          <span className="text-slate-500">➔</span>
                          <span>{fl.route.to}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fl.route.to_description !== fl.route.to && fl.route.to_description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {fl.passengers.length === 0 ? (
                            <span className="text-slate-500 italic">No passengers listed</span>
                          ) : (
                            fl.passengers.map((p, idx) => (
                              <span
                                key={idx}
                                onClick={() => p.matched_person_id && onSelectCorePerson(p.matched_person_id)}
                                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                                  p.has_core_dossier
                                    ? 'bg-sky-950 text-sky-300 border-sky-700/80 cursor-pointer hover:bg-sky-900 font-semibold'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                                }`}
                              >
                                {p.name}
                                {p.has_core_dossier && ' ↗'}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {fl.remarks || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        p. {fl.page_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Manifest Table Pagination */}
            {totalFlightPages > 1 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Page <span className="font-mono text-white">{safeFlightPage}</span> of{' '}
                  <span className="font-mono text-white">{totalFlightPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeFlightPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 px-2 font-mono">
                    {safeFlightPage} / {totalFlightPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalFlightPages, p + 1))}
                    disabled={safeFlightPage === totalFlightPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
