import React, { useState, useMemo } from 'react';
import rawGraphData from './data/graph.json';
import rawPeopleData from './data/people.json';
import rawBlackBookData from './data/black_book.json';
import rawFlightsData from './data/flight_manifests.json';
import rawDoesData from './data/court_does.json';

import {
  GraphData,
  GraphNode,
  PersonRecord,
  FilterState,
  ViewMode,
  ActiveTab,
  BlackBookData,
  FlightManifestsData,
  CourtDoesData,
} from './types';

import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { NetworkGraph } from './components/NetworkGraph';
import { DirectoryView } from './components/DirectoryView';
import { DossierDrawer } from './components/DossierDrawer';
import { PathFinderModal } from './components/PathFinderModal';
import { BlackBookView } from './components/BlackBookView';
import { FlightLogsView } from './components/FlightLogsView';
import { CourtDoesView } from './components/CourtDoesView';

export const App: React.FC = () => {
  const graphData = rawGraphData as unknown as GraphData;
  const peopleData = rawPeopleData as unknown as PersonRecord[];
  const blackBookData = rawBlackBookData as unknown as BlackBookData;
  const flightsData = rawFlightsData as unknown as FlightManifestsData;
  const doesData = rawDoesData as unknown as CourtDoesData;

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('core');

  // Core Network App State
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);
  const [highlightPathNodeIds, setHighlightPathNodeIds] = useState<Set<string> | undefined>(undefined);

  // Filters State for Core Network
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedSectors: [],
    selectedSources: [],
    selectedLegalStandings: [],
    accusedOnly: false,
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

  // Source counts
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      files_list: 0,
      connections_article: 0,
      court_does_and_flights: 0,
    };
    peopleData.forEach(p => {
      const src = p.source_dataset || 'files_list';
      counts[src] = (counts[src] || 0) + 1;
    });
    return counts;
  }, [peopleData]);

  // Legal standing counts
  const legalStandingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    peopleData.forEach(p => {
      const ls = p.legal_standing || 'social_or_professional';
      counts[ls] = (counts[ls] || 0) + 1;
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
            const matchesAliases = (p.aliases || []).some(a => a.toLowerCase().includes(query));
            const matchesTitle = p.profession_summary.toLowerCase().includes(query);
            const matchesOrgs = p.affiliated_organizations.some(o => o.toLowerCase().includes(query));
            const matchesText = p.full_text.toLowerCase().includes(query);
            if (!matchesName && !matchesAliases && !matchesTitle && !matchesOrgs && !matchesText) {
              return false;
            }
          }

          // Source filter
          if (filters.selectedSources.length > 0) {
            const pSource = p.source_dataset || 'files_list';
            if (!filters.selectedSources.includes(pSource)) {
              return false;
            }
          }

          // Sector filter
          if (filters.selectedSectors.length > 0 && !filters.selectedSectors.includes(p.sector)) {
            return false;
          }

          // Accused & Co-conspirators filter
          const pStanding = p.legal_standing || 'social_or_professional';
          if (filters.accusedOnly) {
            const accusedStandings = [
              'convicted_co_conspirator',
              'indicted_co_conspirator',
              'npa_co_conspirator',
              'accused_or_sued',
            ];
            if (!accusedStandings.includes(pStanding)) {
              return false;
            }
          }

          // Legal standing multi-select filter
          if (
            filters.selectedLegalStandings.length > 0 &&
            !filters.selectedLegalStandings.includes(pStanding)
          ) {
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
  const handleSelectPersonFromSearch = (person: PersonRecord) => {
    const node = graphData.nodes.find(n => n.id === person.id);
    if (node) {
      setSelectedNode(node);
    } else {
      handleSelectPeer(person.id);
    }
  };

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

  // Cross-Tab Navigation Handler: Jump from Black Book / Flights / Does to Core Network dossier
  const handleCrossTabNavigate = (personId: string) => {
    setActiveTab('core');
    handleSelectPeer(personId);
  };

  const handleApplyPathHighlight = (nodeIds: string[]) => {
    setHighlightPathNodeIds(new Set(nodeIds));
    setViewMode('graph');
  };

  const selectedPersonRecord = selectedNode ? peopleMap.get(selectedNode.id) || null : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f] text-slate-100">
      {/* Universal Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalPeople={peopleData.length}
        totalFiltered={filteredPersonIds.size}
        blackBookCount={blackBookData.metadata.total_entries}
        flightsCount={flightsData.metadata.total_flights}
        doesCount={doesData.metadata.total_does}
        onOpenPathFinder={() => setIsPathFinderOpen(true)}
      />

      {/* Main View Area Switcher */}
      {activeTab === 'core' && (
        <>
          {/* Filter Toolbar for Core Network */}
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            sectorCounts={sectorCounts}
            sourceCounts={sourceCounts}
            legalStandingCounts={legalStandingCounts}
            totalFiltered={filteredPersonIds.size}
            totalPeople={peopleData.length}
            allPeople={peopleData}
            onSelectPerson={handleSelectPersonFromSearch}
          />

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
          </main>
        </>
      )}

      {activeTab === 'black_book' && (
        <BlackBookView
          data={blackBookData}
          onSelectCorePerson={handleCrossTabNavigate}
        />
      )}

      {activeTab === 'flights' && (
        <FlightLogsView
          data={flightsData}
          onSelectCorePerson={handleCrossTabNavigate}
        />
      )}

      {activeTab === 'court_does' && (
        <CourtDoesView
          data={doesData}
          onSelectCorePerson={handleCrossTabNavigate}
        />
      )}

      {/* Global Slide-Over Dossier Drawer (Accessible across all tabs) */}
      <DossierDrawer
        selectedNode={selectedNode}
        personRecord={selectedPersonRecord}
        onClose={() => {
          setSelectedNode(null);
          setHighlightPathNodeIds(undefined);
        }}
        onSelectPeer={handleSelectPeer}
      />

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
