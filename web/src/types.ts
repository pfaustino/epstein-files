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
  aliases?: string[];
  citations_count: number;
  citations: Citation[];
  source_dataset?: 'files_list' | 'connections_article' | 'court_does_and_flights';
  source_label?: string;
  legal_context?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'organization' | 'location' | 'central_hub';
  category?: string;
  profession?: string;
  sector?: string;
  era?: string;
  aliases?: string[];
  primary_connection?: string;
  image?: string | null;
  wikipedia_url?: string | null;
  color: string;
  size: number;
  degree: number;
  citations_count?: number;
  bio?: string;
  description?: string;
  source_dataset?: 'files_list' | 'connections_article' | 'court_does_and_flights';
  source_label?: string;
  legal_context?: string;
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
  selectedSources: string[];
  visitedIslandOnly: boolean;
  flewPlaneOnly: boolean;
  visitedTownhouseOnly: boolean;
  post2008Only: boolean;
}

export type ViewMode = 'graph' | 'directory' | 'pathfinder';
export type ActiveTab = 'core' | 'black_book' | 'flights' | 'court_does';

// --- Black Book Types ---
export interface BlackBookPhone {
  number: string;
  type: string;
}

export interface BlackBookEntry {
  id: string;
  name: string;
  raw_name: string;
  page_number: number;
  alphabetical_section: string;
  first_letter: string;
  category: string;
  phones: BlackBookPhone[];
  emails: string[];
  addresses: string[];
  notes: string[];
  matched_person_id: string | null;
  matched_person_name: string | null;
  has_core_dossier: boolean;
}

export interface BlackBookData {
  metadata: {
    source: string;
    total_entries: number;
    total_pages: number;
    matched_core_figures: number;
  };
  entries: BlackBookEntry[];
}

// --- Flight Manifest Types ---
export interface FlightPassenger {
  name: string;
  matched_person_id: string | null;
  matched_person_name: string | null;
  has_core_dossier: boolean;
}

export interface FlightRecord {
  id: string;
  page_number: number;
  date: string;
  aircraft: {
    tail_number: string;
    make_model: string;
  };
  route: {
    from: string;
    to: string;
    from_description: string;
    to_description: string;
    display: string;
  };
  remarks: string;
  passengers: FlightPassenger[];
  passenger_count: number;
}

export interface PassengerLeaderboardItem {
  name: string;
  flight_count: number;
  first_flight: string | null;
  last_flight: string | null;
  aircraft_flown: string[];
  top_routes: { route: string; count: number }[];
  top_co_passengers: { name: string; count: number }[];
  matched_person_id: string | null;
  matched_person_name: string | null;
  has_core_dossier: boolean;
}

export interface AirportInfo {
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  hub_type: 'island_gateway' | 'townhouse_gateway' | 'palmbeach_gateway' | 'ranch_gateway' | 'wexner_hq' | 'paris_gateway' | 'london_gateway' | 'standard';
  departures: number;
  arrivals: number;
  total_traffic: number;
}

export interface FlightRoute {
  id: string;
  origin: string;
  destination: string;
  origin_name: string;
  dest_name: string;
  origin_city: string;
  dest_city: string;
  origin_coords: [number, number];
  dest_coords: [number, number];
  flight_count: number;
  is_island_route: boolean;
  top_passengers: { name: string; count: number }[];
  passengers: string[];
  flight_ids: string[];
}

export interface FlightManifestsData {
  metadata: {
    source: string;
    total_flights: number;
    total_passengers_tracked: number;
    total_airports_mapped?: number;
    total_routes_mapped?: number;
    top_destinations: { destination: string; flights: number }[];
  };
  flights: FlightRecord[];
  passengers_leaderboard: PassengerLeaderboardItem[];
  airports?: AirportInfo[];
  routes?: FlightRoute[];
}

// --- Court Does Types ---
export interface CourtDoeRecord {
  id: string;
  doe_number: number;
  doe_label: string;
  name: string;
  status: string;
  role: string;
  ruling_summary: string;
  matched_person_id: string | null;
  matched_person_name: string | null;
  has_core_dossier: boolean;
  docket_number: string;
  primary_order: string;
}

export interface CourtDoesData {
  metadata: {
    source: string;
    total_does: number;
    unsealed_count: number;
    sealed_count: number;
    matched_core_figures: number;
  };
  does: CourtDoeRecord[];
}
