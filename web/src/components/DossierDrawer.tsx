import React from 'react';
import {
  X,
  ExternalLink,
  Palmtree,
  Plane,
  Building2,
  Calendar,
  Users,
  Briefcase,
  AlertTriangle,
  FileText,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Ban,
} from 'lucide-react';
import { PersonRecord, GraphNode } from '../types';
import { SECTOR_COLORS } from './FilterBar';

interface DossierDrawerProps {
  selectedNode: GraphNode | null;
  personRecord: PersonRecord | null;
  onClose: () => void;
  onSelectPeer: (peerId: string) => void;
}

export const DossierDrawer: React.FC<DossierDrawerProps> = ({
  selectedNode,
  personRecord,
  onClose,
  onSelectPeer,
}) => {
  if (!selectedNode) return null;

  // Sector style
  const sectorStyle = selectedNode.sector
    ? SECTOR_COLORS[selectedNode.sector] || {
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
        activeBg: 'bg-slate-700 text-white',
      }
    : null;

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#0c0f18]/95 backdrop-blur-xl border-l border-slate-800/80 shadow-2xl z-30 flex flex-col transition-all duration-300">
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-800/80 px-5 flex items-center justify-between shrink-0 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Dossier Inspector
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {selectedNode.type.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Profile Card Header */}
        <div className="flex items-start gap-4">
          {/* Avatar / Portrait */}
          <div className="relative shrink-0">
            {selectedNode.image ? (
              <img
                src={selectedNode.image}
                alt={selectedNode.label}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-lg bg-slate-900"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                style={{ backgroundColor: selectedNode.color || '#334155' }}
              >
                {selectedNode.label
                  .split(' ')
                  .map(p => p[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
          </div>

          {/* Title & Badges */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight truncate">
              {selectedNode.label}
            </h2>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {selectedNode.profession || selectedNode.description || 'Public Figure'}
            </p>

            {/* Sector & Era Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {selectedNode.sector && sectorStyle && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sectorStyle.bg} ${sectorStyle.text} ${sectorStyle.border}`}
                >
                  {selectedNode.sector}
                </span>
              )}
              {selectedNode.era && (
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    selectedNode.era.includes('Post-2008')
                      ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {selectedNode.era}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* If Person Record is available */}
        {personRecord && (
          <>
            {/* Primary Connection to Epstein Box */}
            <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  Connection to Epstein
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {personRecord.connection_to_epstein.primary_nature}
                </span>
              </div>

              {/* Interaction Channels */}
              {personRecord.connection_to_epstein.interaction_channels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Channels:</span>
                  {personRecord.connection_to_epstein.interaction_channels.map(ch => (
                    <span
                      key={ch}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Properties & Island Status */}
            <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Epstein Properties & Island Visits
              </h3>

              {/* Little St James Island */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#090b10] border border-slate-800/80">
                <div className="p-1.5 rounded-md bg-rose-950/60 text-rose-400 shrink-0">
                  <Palmtree className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Little Saint James (Island)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider font-mono ${
                        personRecord.property_visits.island_status === 'Visited'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : personRecord.property_visits.island_status === 'Invited'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : personRecord.property_visits.island_status === 'Denied'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {personRecord.property_visits.island_status}
                    </span>
                  </div>
                  {personRecord.property_visits.island_notes && (
                    <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                      "{personRecord.property_visits.island_notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Townhouse */}
              {personRecord.property_visits.townhouse_status !== 'None' && (
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#090b10] border border-slate-800/80">
                  <div className="p-1.5 rounded-md bg-amber-950/60 text-amber-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        NYC Townhouse (Herbert N. Straus)
                      </span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                        {personRecord.property_visits.townhouse_status}
                      </span>
                    </div>
                    {personRecord.property_visits.townhouse_notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                        "{personRecord.property_visits.townhouse_notes}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Palm Beach */}
              {personRecord.property_visits.palm_beach_status !== 'None' && (
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#090b10] border border-slate-800/80">
                  <div className="p-1.5 rounded-md bg-orange-950/60 text-orange-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        Palm Beach Mansion
                      </span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800">
                        {personRecord.property_visits.palm_beach_status}
                      </span>
                    </div>
                    {personRecord.property_visits.palm_beach_notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                        "{personRecord.property_visits.palm_beach_notes}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Zorro Ranch */}
              {personRecord.property_visits.zorro_ranch_status !== 'None' && (
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#090b10] border border-slate-800/80">
                  <div className="p-1.5 rounded-md bg-yellow-950/60 text-yellow-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        Zorro Ranch (New Mexico)
                      </span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.2 rounded bg-yellow-950 text-yellow-400 border border-yellow-800">
                        {personRecord.property_visits.zorro_ranch_status}
                      </span>
                    </div>
                    {personRecord.property_visits.zorro_ranch_notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                        "{personRecord.property_visits.zorro_ranch_notes}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Flight Travel Box */}
            {personRecord.flight_logs.flew_on_private_plane && (
              <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Plane className="w-3.5 h-3.5" />
                    Private Aircraft Travel
                  </span>
                  {personRecord.flight_logs.flight_count_estimate && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                      {personRecord.flight_logs.flight_count_estimate}+ Flights Logged
                    </span>
                  )}
                </div>
                {personRecord.flight_logs.flight_notes && (
                  <p className="text-xs text-slate-300 italic pt-1">
                    "{personRecord.flight_logs.flight_notes}"
                  </p>
                )}
              </div>
            )}

            {/* Mutual Connections / Connected People */}
            {personRecord.connected_individuals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    Mutual Connections on List
                  </h3>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {personRecord.connected_individuals.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {personRecord.connected_individuals.map(peer => (
                    <button
                      key={peer.target_id}
                      onClick={() => onSelectPeer(peer.target_id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/90 text-slate-200 hover:bg-cyan-900/60 hover:text-cyan-200 border border-slate-700/60 hover:border-cyan-700 transition-all text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{peer.target_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Affiliated Organizations */}
            {personRecord.affiliated_organizations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Institutions & Organizations
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {personRecord.affiliated_organizations.map(org => (
                    <span
                      key={org}
                      className="px-2.5 py-1 rounded-lg text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-800/50 font-medium"
                    >
                      {org}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Biographical Narrative */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Wikipedia Narrative Excerpt
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                {personRecord.full_text}
              </p>
            </div>

            {/* Citations Count */}
            {personRecord.citations_count > 0 && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                <span>Footnote Citations: {personRecord.citations_count}</span>
                <span className="font-mono text-slate-400">Source: Court Docs / News</span>
              </div>
            )}
          </>
        )}

        {/* Action Button: Wikipedia External Link */}
        {selectedNode.wikipedia_url && (
          <a
            href={selectedNode.wikipedia_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 transition-colors shadow-lg"
          >
            <span>Open Wikipedia Article</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </aside>
  );
};
