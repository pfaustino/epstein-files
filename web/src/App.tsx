import React, { useState, useMemo } from 'react';
import rawGraphData from './data/graph.json';
import rawPeopleData from './data/people.json';
import { GraphData, GraphNode, PersonRecord, FilterState, ViewMode } from './types';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { NetworkGraph } from './components/NetworkGraph';
import { DirectoryView } from './components/DirectoryView';
import { DossierDrawer } from './components/DossierDrawer';
import { PathFinderModal } from './components/PathFinderModal';

export const App: React.FC = () => {
  const graphData = rawGraphData as unknown as GraphData;
  const peopleData = rawPeopleData as unknown as PersonRecord[];

  // App State
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);
  const [highlightPathNodeIds, setHighlightPathNodeIds] = useState<Set<string> | undefined>(undefined);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedSectors: [],
    visitedIslandOnly: false,
    flewPlaneOnly: false,
    visitedTownhouseOnly: false,
    post2008Only: false,
  });

  // People map by id
  const peopleMap = useMemo(() => {
    const map = new Map<string, PersonRecord>();
    peopleData.forEach(p => map.set(p.id, p));
    return map;
  }, [peopleData]);

  // Sector counts
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    peopleData.forEach(p => {
      counts[p.sector] = (counts[p.sector] || 0) + 1;
    });
    return counts;
  }, [peopleData]);

  // Filtered Person IDs based on active filters
  const filteredPersonIds = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    return new Set(
      peopleData
        .filter(p => {
          // Search query matching
          if (query) {
            const matchesName = p.name.toLowerCase().includes(query);
            const matchesTitle = p.profession_summary.toLowerCase().includes(query);
            const matchesOrgs = p.affiliated_organizations.some(o => o.toLowerCase().includes(query));
            const matchesText = p.full_text.toLowerCase().includes(query);
            if (!matchesName && !matchesTitle && !matchesOrgs && !matchesText) {
              return false;
            }
          }

          // Sector filter
          if (filters.selectedSectors.length > 0 && !filters.selectedSectors.includes(p.sector)) {
            return false;
          }

          // Visited Island filter
          if (filters.visitedIslandOnly && p.property_visits.island_status !== 'Visited') {
            return false;
          }

          // Flew on Private Jet filter
          if (filters.flewPlaneOnly && !p.flight_logs.flew_on_private_plane) {
            return false;
          }

          // Townhouse filter
          if (filters.visitedTownhouseOnly && p.property_visits.townhouse_status !== 'Visited') {
            return false;
          }

          // Post-2008 contact filter
          if (filters.post2008Only && !p.connection_to_epstein.has_post_2008_ties) {
            return false;
          }

          return true;
        })
        .map(p => p.id)
    );
  }, [peopleData, filters]);

  // Handlers
  const handleSelectPeer = (peerId: string) => {
    const peerNode = graphData.nodes.find(n => n.id === peerId);
    if (peerNode) {
      setSelectedNode(peerNode);
    } else {
      const peerPerson = peopleMap.get(peerId);
      if (peerPerson) {
        setSelectedNode({
          id: peerPerson.id,
          label: peerPerson.name,
          type: 'person',
          sector: peerPerson.sector,
          profession: peerPerson.profession_summary,
          era: peerPerson.connection_to_epstein.era,
          image: peerPerson.image_thumb,
          wikipedia_url: peerPerson.wikipedia_url,
          color: '#6366f1',
          size: 20,
          degree: peerPerson.connected_individuals.length,
          bio: peerPerson.full_text,
        });
      }
    }
  };

  const handleApplyPathHighlight = (nodeIds: string[]) => {
    setHighlightPathNodeIds(new Set(nodeIds));
    setViewMode('graph');
  };

  const selectedPersonRecord = selectedNode ? peopleMap.get(selectedNode.id) || null : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f] text-slate-100">
      {/* Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalPeople={peopleData.length}
        totalFiltered={filteredPersonIds.size}
        onOpenPathFinder={() => setIsPathFinderOpen(true)}
      />

      {/* Filter Toolbar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sectorCounts={sectorCounts}
        totalFiltered={filteredPersonIds.size}
        totalPeople={peopleData.length}
      />

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden flex">
        {viewMode === 'graph' ? (
          <NetworkGraph
            graphData={graphData}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            filteredNodeIds={filteredPersonIds}
            highlightPathNodeIds={highlightPathNodeIds}
          />
        ) : (
          <DirectoryView
            people={peopleData}
            onSelectPerson={setSelectedNode}
            filteredIds={filteredPersonIds}
          />
        )}

        {/* Dossier Drawer */}
        <DossierDrawer
          selectedNode={selectedNode}
          personRecord={selectedPersonRecord}
          onClose={() => {
            setSelectedNode(null);
            setHighlightPathNodeIds(undefined);
          }}
          onSelectPeer={handleSelectPeer}
        />
      </main>

      {/* Path Finder Modal */}
      <PathFinderModal
        isOpen={isPathFinderOpen}
        onClose={() => setIsPathFinderOpen(false)}
        graphData={graphData}
        people={peopleData}
        onApplyPathHighlight={handleApplyPathHighlight}
      />
    </div>
  );
};

export default App;
