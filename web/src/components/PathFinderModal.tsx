import React, { useState, useMemo } from 'react';
import { X, Route, ArrowRight, Sparkles, User, Search, CornerDownRight } from 'lucide-react';
import { GraphData, GraphNode, PersonRecord } from '../types';

interface PathFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphData;
  people: PersonRecord[];
  onApplyPathHighlight: (nodeIds: string[]) => void;
}

interface PathHop {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  image?: string | null;
  edgeLabel?: string;
}

export const PathFinderModal: React.FC<PathFinderModalProps> = ({
  isOpen,
  onClose,
  graphData,
  people,
  onApplyPathHighlight,
}) => {
  const [sourceId, setSourceId] = useState<string>('bill-clinton');
  const [targetId, setTargetId] = useState<string>('peter-thiel');
  const [path, setPath] = useState<PathHop[] | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Build adjacency map for BFS
  const adjacency = useMemo(() => {
    const adj: Record<string, { neighborId: string; edgeLabel: string }[]> = {};
    graphData.nodes.forEach(n => {
      adj[n.id] = [];
    });

    graphData.edges.forEach(e => {
      const s = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
      const t = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
      if (adj[s] && adj[t]) {
        adj[s].push({ neighborId: t, edgeLabel: e.label || 'Connected' });
        adj[t].push({ neighborId: s, edgeLabel: e.label || 'Connected' });
      }
    });

    return adj;
  }, [graphData]);

  // Node lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graphData.nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [graphData.nodes]);

  // BFS Algorithm to find shortest path
  const findPath = () => {
    setHasCalculated(true);
    if (!sourceId || !targetId || sourceId === targetId) {
      setPath(null);
      return;
    }

    const queue: { current: string; trail: { nodeId: string; edgeLabel?: string }[] }[] = [
      { current: sourceId, trail: [{ nodeId: sourceId }] },
    ];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { current, trail } = queue.shift()!;

      if (current === targetId) {
        // Build result
        const resultHops: PathHop[] = trail.map((hop, idx) => {
          const n = nodeMap.get(hop.nodeId);
          return {
            nodeId: hop.nodeId,
            nodeLabel: n?.label || hop.nodeId,
            nodeType: n?.type || 'person',
            image: n?.image,
            edgeLabel: hop.edgeLabel,
          };
        });
        setPath(resultHops);
        return;
      }

      const neighbors = adjacency[current] || [];
      for (const { neighborId, edgeLabel } of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({
            current: neighborId,
            trail: [...trail, { nodeId: neighborId, edgeLabel }],
          });
        }
      }
    }

    setPath(null); // No path found
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f121c] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Degrees of Separation Finder
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 font-mono">
                  BACON NUMBER
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Discover the shortest chain of connections between any two entities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Select inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Person A */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Start Person / Entity
              </label>
              <select
                value={sourceId}
                onChange={e => {
                  setSourceId(e.target.value);
                  setHasCalculated(false);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {graphData.nodes
                  .filter(n => n.type === 'person')
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(n => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.sector})
                    </option>
                  ))}
              </select>
            </div>

            {/* Person B */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Person / Entity
              </label>
              <select
                value={targetId}
                onChange={e => {
                  setTargetId(e.target.value);
                  setHasCalculated(false);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {graphData.nodes
                  .filter(n => n.type === 'person')
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(n => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.sector})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px] text-slate-500">Popular comparisons:</span>
            <button
              onClick={() => {
                setSourceId('bill-clinton');
                setTargetId('peter-thiel');
                setHasCalculated(false);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              Clinton ➔ Thiel
            </button>
            <button
              onClick={() => {
                setSourceId('woody-allen');
                setTargetId('ehud-barak');
                setHasCalculated(false);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              Woody Allen ➔ Ehud Barak
            </button>
            <button
              onClick={() => {
                setSourceId('leon-black');
                setTargetId('adam-back');
                setHasCalculated(false);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              Leon Black ➔ Adam Back
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={findPath}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-950/30 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Trace Connection Path</span>
          </button>

          {/* Path Results */}
          {hasCalculated && (
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              {path ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-400">
                      Found Path: {path.length - 1} Degrees of Separation
                    </span>
                    <button
                      onClick={() => {
                        onApplyPathHighlight(path.map(p => p.nodeId));
                        onClose();
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>Highlight on Graph Canvas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Step by step timeline */}
                  <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    {path.map((hop, idx) => (
                      <React.Fragment key={hop.nodeId + idx}>
                        {idx > 0 && (
                          <div className="flex items-center gap-2 pl-4 py-1 text-slate-500 text-xs">
                            <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700">
                              {hop.edgeLabel || 'Connected'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#090b10] border border-slate-800/60">
                          {hop.image ? (
                            <img
                              src={hop.image}
                              alt={hop.nodeLabel}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-900/40 border border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-300">
                              {hop.nodeLabel.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-white">{hop.nodeLabel}</p>
                            <p className="text-[10px] text-slate-400 font-mono capitalize">
                              {hop.nodeType}
                            </p>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No path found between these two individuals in the current dataset.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
