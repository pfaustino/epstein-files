export interface Citation {
  ref_id: string;
  label: string;
}

export interface ConnectedPeer {
  target_id: string;
  target_name: string;
}

export interface PropertyVisits {
  island_status: 'None' | 'Visited' | 'Invited' | 'Referenced' | 'Denied';
  island_notes: string | null;
  townhouse_status: 'None' | 'Visited' | 'Offered' | 'Referenced';
  townhouse_notes: string | null;
  palm_beach_status: 'None' | 'Visited / Stayed' | 'Referenced';
  palm_beach_notes: string | null;
  zorro_ranch_status: 'None' | 'Visited / Stayed' | 'Offered' | 'Referenced';
  zorro_ranch_notes: string | null;
  paris_status: 'None' | 'Used / Stayed' | 'Referenced';
  paris_notes: string | null;
  any_property_visited_or_offered: boolean;
}

export interface ConnectionToEpstein {
  relationship_types: string[];
  primary_nature: string;
  era: 'Post-2008 Only' | 'Pre-2008 Only' | 'Both Pre- & Post-2008' | 'Undated / Ongoing';
  has_pre_2008_ties: boolean;
  has_post_2008_ties: boolean;
  years_mentioned: number[];
  interaction_channels: string[];
}

export interface FlightLogs {
  flew_on_private_plane: boolean;
  flight_count_estimate: number | null;
  flight_notes: string | null;
}

export interface PersonRecord {
  id: string;
  name: string;
  anchor: string;
  wikipedia_url: string | null;
  image_thumb: string | null;
  image_full: string | null;
  image_caption: string | null;
  category_tag: string | null;
  sector: string;
  profession_summary: string;
  full_text: string;
  connection_to_epstein: ConnectionToEpstein;
  property_visits: PropertyVisits;
  flight_logs: FlightLogs;
  affiliated_organizations: string[];
  connected_individuals: ConnectedPeer[];
  citations_count: number;
  citations: Citation[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'organization' | 'location' | 'central_hub';
  category?: string;
  profession?: string;
  sector?: string;
  era?: string;
  primary_connection?: string;
  image?: string | null;
  wikipedia_url?: string | null;
  color: string;
  size: number;
  degree: number;
  citations_count?: number;
  bio?: string;
  description?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  label: string;
  era?: string;
  channels?: string[];
  style?: string;
  color: string;
  weight: number;
  status?: string;
  notes?: string;
}

export interface GraphData {
  metadata: {
    total_nodes: number;
    total_edges: number;
    people_count: number;
    organization_count: number;
    location_count: number;
    peer_connection_count: number;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FilterState {
  searchQuery: string;
  selectedSectors: string[];
  visitedIslandOnly: boolean;
  flewPlaneOnly: boolean;
  visitedTownhouseOnly: boolean;
  post2008Only: boolean;
}

export type ViewMode = 'graph' | 'directory' | 'pathfinder';
