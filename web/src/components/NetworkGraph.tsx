import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide } from 'd3-force';
import { ZoomIn, ZoomOut, Maximize2, Crosshair, SlidersHorizontal, Sparkles } from 'lucide-react';
import { GraphNode, GraphEdge, GraphData } from '../types';

interface NetworkGraphProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
  filteredNodeIds: Set<string>;
  highlightPathNodeIds?: Set<string>;
}

// Global image cache for canvas avatar drawing
const imageCache: Record<string, HTMLImageElement> = {};

export type SpacingMode = 'compact' | 'balanced' | 'spacious';

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  graphData,
  selectedNode,
  onSelectNode,
  filteredNodeIds,
  highlightPathNodeIds,
}) => {
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [spacingMode, setSpacingMode] = useState<SpacingMode>('spacious');
  const initialFitDone = useRef(false);

  // Resize listener
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Preload node portrait images
  useEffect(() => {
    graphData.nodes.forEach(node => {
      if (node.image && !imageCache[node.image]) {
        const img = new Image();
        img.src = node.image;
        img.onload = () => {
          imageCache[node.image!] = img;
        };
      }
    });
  }, [graphData.nodes]);

  // Determine active neighbors of selected or hovered node
  const activeNeighbors = useMemo(() => {
    const neighbors = new Set<string>();
    const target = hoveredNode || selectedNode;
    if (target) {
      neighbors.add(target.id);
      graphData.edges.forEach(edge => {
        const sourceId = typeof edge.source === 'object' ? (edge.source as GraphNode).id : edge.source;
        const targetId = typeof edge.target === 'object' ? (edge.target as GraphNode).id : edge.target;
        if (sourceId === target.id) neighbors.add(targetId);
        if (targetId === target.id) neighbors.add(sourceId);
      });
    }
    return neighbors;
  }, [hoveredNode, selectedNode, graphData.edges]);

  // Filter nodes & edges for graph visualization
  const filteredData = useMemo(() => {
    // Collect all valid person node IDs that match the active filters + hub
    const visiblePersonIds = new Set<string>();
    visiblePersonIds.add('jeffrey-epstein');
    graphData.nodes.forEach(n => {
      if (filteredNodeIds.has(n.id)) {
        visiblePersonIds.add(n.id);
      }
    });

    // Find active orgs and locations that have edges to at least one visible person
    const connectedAuxNodeIds = new Set<string>();
    graphData.edges.forEach(e => {
      const sourceId = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
      const targetId = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
      
      if (visiblePersonIds.has(sourceId) && sourceId !== 'jeffrey-epstein') {
        connectedAuxNodeIds.add(targetId);
      }
      if (visiblePersonIds.has(targetId) && targetId !== 'jeffrey-epstein') {
        connectedAuxNodeIds.add(sourceId);
      }
    });

    const isUnfiltered = filteredNodeIds.size >= graphData.nodes.filter(n => n.type === 'person').length;
    const visibleNodeIdSet = new Set<string>();

    graphData.nodes.forEach(n => {
      if (n.id === 'jeffrey-epstein' || visiblePersonIds.has(n.id)) {
        visibleNodeIdSet.add(n.id);
      } else if (n.type === 'organization' || n.type === 'location') {
        if (isUnfiltered || connectedAuxNodeIds.has(n.id)) {
          visibleNodeIdSet.add(n.id);
        }
      }
    });

    const visibleNodes = graphData.nodes.filter(n => visibleNodeIdSet.has(n.id));

    const visibleEdges = graphData.edges.filter(e => {
      const sourceId = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
      const targetId = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
      return visibleNodeIdSet.has(sourceId) && visibleNodeIdSet.has(targetId);
    });

    return {
      nodes: visibleNodes,
      links: visibleEdges,
    };
  }, [graphData, filteredNodeIds]);

  // Configure D3 Forces: Repulsion, Link Distances, and Non-Overlapping Collision
  useEffect(() => {
    if (!fgRef.current) return;

    // 1. Repulsion Charge (Much stronger negative charge pushes nodes far apart)
    const chargeStrength = spacingMode === 'spacious' ? -1000 : spacingMode === 'balanced' ? -650 : -350;
    const chargeForce: any = fgRef.current.d3Force('charge');
    if (chargeForce) {
      chargeForce.strength(chargeStrength);
      chargeForce.distanceMax(1800);
    }

    // 2. Link Distance (Loosens the connection length between nodes)
    const distMultiplier = spacingMode === 'spacious' ? 1.8 : spacingMode === 'balanced' ? 1.35 : 1.0;
    const linkForce: any = fgRef.current.d3Force('link');
    if (linkForce) {
      linkForce.distance((link: any) => {
        if (link.type === 'PROPERTY_VISIT') return 200 * distMultiplier;
        if (link.type === 'PEER_CONNECTION') return 180 * distMultiplier;
        return 140 * distMultiplier;
      });
    }

    // 3. Collision Force (STRICT OVERLAP PREVENTION)
    const collisionPadding = spacingMode === 'spacious' ? 38 : spacingMode === 'balanced' ? 26 : 16;
    fgRef.current.d3Force(
      'collide',
      forceCollide()
        .radius((node: any) => {
          const r = Math.max((node.size || 15) * 0.65, 7);
          if (node.type === 'location' || node.type === 'organization') {
            return r * 2.4;
          }
          return r + collisionPadding;
        })
        .iterations(4)
    );

    // Reheat simulation so new spacing takes effect smoothly
    fgRef.current.d3ReheatSimulation();
  }, [filteredData, spacingMode]);

  // Zoom controls
  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 300);
  const handleFitView = () => fgRef.current?.zoomToFit(500, 80);
  const handleRecenter = () => {
    fgRef.current?.centerAt(0, 0, 400);
    fgRef.current?.zoom(0.85, 400);
  };

  // Focus on selected node
  useEffect(() => {
    if (selectedNode && fgRef.current && selectedNode.x !== undefined && selectedNode.y !== undefined) {
      fgRef.current.centerAt(selectedNode.x, selectedNode.y, 500);
      fgRef.current.zoom(1.8, 500);
    }
  }, [selectedNode]);

  // Initial fit when simulation settles
  const handleEngineStop = useCallback(() => {
    if (!initialFitDone.current) {
      fgRef.current?.zoomToFit(600, 80);
      initialFitDone.current = true;
    }
  }, []);

  // Node Canvas Rendering
  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isTarget = (hoveredNode && hoveredNode.id === node.id) || (selectedNode && selectedNode.id === node.id);
      const isNeighbor = activeNeighbors.has(node.id);
      const isPath = highlightPathNodeIds && highlightPathNodeIds.has(node.id);

      // Opacity dimming if highlighting is active
      const hasActiveHighlight = Boolean(hoveredNode || selectedNode || highlightPathNodeIds?.size);
      let opacity = 1.0;
      if (hasActiveHighlight) {
        if (isPath || isTarget) {
          opacity = 1.0;
        } else if (isNeighbor) {
          opacity = 0.9;
        } else {
          opacity = 0.12;
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;

      const r = Math.max((node.size || 15) * 0.65, 7);

      // Special Node: Central Hub (Epstein)
      if (node.type === 'central_hub') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.6, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#090a0f';
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        // Pulsing border ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.0, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#ef444499';
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Special Node: Locations
      else if (node.type === 'location') {
        const w = r * 3.2;
        const h = r * 1.7;
        ctx.fillStyle = node.color || '#ea580c';
        ctx.beginPath();
        ctx.roundRect(node.x - w / 2, node.y - h / 2, w, h, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label inside location pill
        ctx.font = `bold ${Math.max(9 / globalScale, 6)}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = node.label.split('(')[0].trim();
        ctx.fillText(label, node.x, node.y);
        ctx.restore();
        return;
      }
      // Special Node: Organizations
      else if (node.type === 'organization') {
        const w = r * 2.8;
        const h = r * 1.5;
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.roundRect(node.x - w / 2, node.y - h / 2, w, h, 5);
        ctx.fill();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = `600 ${Math.max(8.5 / globalScale, 5.5)}px Inter, sans-serif`;
        ctx.fillStyle = '#e0e7ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
        ctx.restore();
        return;
      }
      // Person Node: Avatar circle
      else {
        // Outer selection / highlight glow
        if (isTarget || isPath) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI, false);
          ctx.fillStyle = isPath ? '#38bdf844' : '#6366f144';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = isPath ? '#38bdf8' : '#a855f7';
          ctx.stroke();
        }

        // Base circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color || '#334155';
        ctx.fill();

        // Clip photo if available
        const img = node.image ? imageCache[node.image] : null;
        if (img && img.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, r - 1.5, 0, 2 * Math.PI, false);
          ctx.clip();
          ctx.drawImage(img, node.x - r, node.y - r, r * 2, r * 2);
          ctx.restore();
        } else {
          // Initials fallback
          ctx.font = `bold ${Math.max(r * 0.75, 7)}px Inter, sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const initials = node.label
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2);
          ctx.fillText(initials, node.x, node.y);
        }

        // Colored ring by sector
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.lineWidth = isTarget ? 3.5 : 2;
        ctx.strokeStyle = isTarget ? '#ffffff' : node.color || '#64748b';
        ctx.stroke();
      }

      // Draw label below node if zoomed in or highlighted
      if (globalScale > 0.65 || isTarget || isPath || isNeighbor) {
        ctx.font = `${isTarget ? 'bold' : 'normal'} ${Math.max(10 / globalScale, 7.5)}px Inter, sans-serif`;
        const text = node.label;
        const textWidth = ctx.measureText(text).width;
        const labelY = node.y + r + 8 / globalScale;

        // Label pill background
        ctx.fillStyle = 'rgba(9, 10, 15, 0.85)';
        ctx.beginPath();
        ctx.roundRect(
          node.x - textWidth / 2 - 4,
          labelY - 5 / globalScale,
          textWidth + 8,
          10 / globalScale + 3,
          3
        );
        ctx.fill();

        ctx.fillStyle = isTarget ? '#38bdf8' : isPath ? '#38bdf8' : '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(text, node.x, labelY);
      }

      ctx.restore();
    },
    [hoveredNode, selectedNode, activeNeighbors, highlightPathNodeIds]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#07090e] overflow-hidden select-none">
      <ForceGraph2D
        ref={fgRef as any}
        width={dimensions.width}
        height={dimensions.height}
        graphData={filteredData}
        nodeId="id"
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, (node.size || 15) * 0.7 + 4, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        linkColor={(edge: any) => {
          const sId = typeof edge.source === 'object' ? edge.source.id : edge.source;
          const tId = typeof edge.target === 'object' ? edge.target.id : edge.target;
          const target = hoveredNode || selectedNode;

          if (highlightPathNodeIds && highlightPathNodeIds.has(sId) && highlightPathNodeIds.has(tId)) {
            return '#38bdf8';
          }

          if (target) {
            if (sId === target.id || tId === target.id) {
              return edge.color || '#818cf8';
            }
            return 'rgba(51, 65, 85, 0.06)';
          }

          if (edge.type === 'PROPERTY_VISIT') return '#dc2626aa';
          if (edge.type === 'PEER_CONNECTION') return '#38bdf888';
          return 'rgba(100, 116, 139, 0.18)';
        }}
        linkWidth={(edge: any) => {
          const sId = typeof edge.source === 'object' ? edge.source.id : edge.source;
          const tId = typeof edge.target === 'object' ? edge.target.id : edge.target;
          const target = hoveredNode || selectedNode;

          if (highlightPathNodeIds && highlightPathNodeIds.has(sId) && highlightPathNodeIds.has(tId)) {
            return 3.5;
          }

          if (target && (sId === target.id || tId === target.id)) {
            return 2.5;
          }
          return 1;
        }}
        linkDirectionalParticles={(edge: any) => {
          const sId = typeof edge.source === 'object' ? edge.source.id : edge.source;
          const tId = typeof edge.target === 'object' ? edge.target.id : edge.target;
          const target = hoveredNode || selectedNode;
          if (highlightPathNodeIds && highlightPathNodeIds.has(sId) && highlightPathNodeIds.has(tId)) return 4;
          if (target && (sId === target.id || tId === target.id)) return 2;
          return 0;
        }}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleColor={() => '#38bdf8'}
        onNodeHover={(node: any) => setHoveredNode(node || null)}
        onNodeClick={(node: any) => {
          if (selectedNode?.id === node.id) {
            onSelectNode(null);
          } else {
            onSelectNode(node);
          }
        }}
        onBackgroundClick={() => onSelectNode(null)}
        onEngineStop={handleEngineStop}
        cooldownTicks={250}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
      />

      {/* Floating Canvas Controls + Spacing Presets */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2.5 z-10">
        {/* Spacing Selector Pills */}
        <div className="flex items-center gap-1.5 bg-[#0f131d]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl text-xs">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Spacing:
          </span>
          <button
            onClick={() => setSpacingMode('compact')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              spacingMode === 'compact'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => setSpacingMode('balanced')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              spacingMode === 'balanced'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => setSpacingMode('spacious')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              spacingMode === 'spacious'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Spacious (Loosest)
          </button>
        </div>

        {/* Zoom & Navigation Actions */}
        <div className="flex items-center gap-1 bg-[#0f131d]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl w-fit">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Fit All Nodes in View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRecenter}
            className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Recenter on Jeffrey Epstein"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Legend / Help Indicator */}
      <div className="absolute top-4 right-4 hidden md:flex items-center gap-3 bg-[#0f131d]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 z-10 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50"></span>
          <span>Properties</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-indigo-500 inline-block shadow-sm shadow-indigo-500/50"></span>
          <span>Institutions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-sm shadow-cyan-500/50"></span>
          <span>Mutual Ties</span>
        </div>
      </div>
    </div>
  );
};
