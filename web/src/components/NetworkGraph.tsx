import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';
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
    // If no filter, show everything
    const isFiltered = filteredNodeIds.size < graphData.nodes.length;

    // Node is visible if in filtered list OR is Epstein OR is connected to a filtered node
    const visibleNodes = graphData.nodes.filter(n => {
      if (n.id === 'jeffrey-epstein') return true;
      if (n.type === 'location' || n.type === 'organization') return true;
      return filteredNodeIds.has(n.id);
    });

    const visibleNodeIdSet = new Set(visibleNodes.map(n => n.id));

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

  // Zoom controls
  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 300);
  const handleFitView = () => fgRef.current?.zoomToFit(400, 50);
  const handleRecenter = () => {
    fgRef.current?.centerAt(0, 0, 400);
    fgRef.current?.zoom(1.2, 400);
  };

  // Focus on selected node
  useEffect(() => {
    if (selectedNode && fgRef.current && selectedNode.x !== undefined && selectedNode.y !== undefined) {
      fgRef.current.centerAt(selectedNode.x, selectedNode.y, 500);
      fgRef.current.zoom(2.0, 500);
    }
  }, [selectedNode]);

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
          opacity = 0.15;
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;

      const r = Math.max((node.size || 15) * 0.65, 7);

      // Special Node: Central Hub (Epstein)
      if (node.type === 'central_hub') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.5, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#090a0f';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        // Icon ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.8, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#ef444488';
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Special Node: Locations
      else if (node.type === 'location') {
        const w = r * 2.8;
        const h = r * 1.6;
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
        const w = r * 2.6;
        const h = r * 1.4;
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
          ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = isPath ? '#38bdf844' : '#6366f144';
          ctx.fill();
          ctx.lineWidth = 2.5;
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
        ctx.lineWidth = isTarget ? 3 : 2;
        ctx.strokeStyle = isTarget ? '#ffffff' : node.color || '#64748b';
        ctx.stroke();
      }

      // Draw label below node if zoomed in or highlighted
      if (globalScale > 0.7 || isTarget || isPath || isNeighbor) {
        ctx.font = `${isTarget ? 'bold' : 'normal'} ${Math.max(10 / globalScale, 7.5)}px Inter, sans-serif`;
        const text = node.label;
        const textWidth = ctx.measureText(text).width;
        const labelY = node.y + r + 8 / globalScale;

        // Label pill background
        ctx.fillStyle = 'rgba(9, 10, 15, 0.85)';
        ctx.beginPath();
        ctx.roundRect(
          node.x - textWidth / 2 - 3,
          labelY - 5 / globalScale,
          textWidth + 6,
          10 / globalScale + 2,
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
          ctx.arc(node.x, node.y, (node.size || 15) * 0.7 + 3, 0, 2 * Math.PI, false);
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
            return 'rgba(51, 65, 85, 0.08)';
          }

          if (edge.type === 'PROPERTY_VISIT') return '#dc2626aa';
          if (edge.type === 'PEER_CONNECTION') return '#38bdf888';
          return 'rgba(100, 116, 139, 0.22)';
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
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2 bg-[#0f131d]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl z-10">
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
          title="Fit All Nodes"
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

      {/* Graph Legend / Help Indicator */}
      <div className="absolute top-4 right-4 hidden md:flex items-center gap-3 bg-[#0f131d]/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-800/70 text-[11px] text-slate-400 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span>Properties</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-indigo-500 inline-block"></span>
          <span>Institutions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
          <span>Mutual Ties</span>
        </div>
      </div>
    </div>
  );
};
