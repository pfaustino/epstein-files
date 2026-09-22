import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { AirportInfo, FlightRoute } from '../types';
import { Plane, Navigation, Compass, Layers, Info, X, ExternalLink, Sparkles, MapPin } from 'lucide-react';

interface FlightRouteMapProps {
  airports: AirportInfo[];
  routes: FlightRoute[];
  searchQuery?: string;
  coreOnly?: boolean;
  selectedRouteId?: string | null;
  onSelectRoute?: (route: FlightRoute | null) => void;
  onSelectAirport?: (airportCode: string) => void;
  onSelectCorePerson?: (personId: string) => void;
}

// Color coding for hub types
const HUB_COLORS: Record<string, { fill: string; stroke: string; label: string; glow?: string }> = {
  island_gateway: { fill: '#f43f5e', stroke: '#fda4af', label: 'Little St. James Gateway (TIST)', glow: 'rgba(244, 63, 94, 0.4)' },
  palmbeach_gateway: { fill: '#f59e0b', stroke: '#fde68a', label: 'Palm Beach Hub (PBI)', glow: 'rgba(245, 158, 11, 0.3)' },
  townhouse_gateway: { fill: '#38bdf8', stroke: '#bae6fd', label: 'NYC / Townhouse Gateway (TEB)', glow: 'rgba(56, 189, 248, 0.3)' },
  ranch_gateway: { fill: '#a855f7', stroke: '#e9d5ff', label: 'Zorro Ranch Gateway (SAF)', glow: 'rgba(168, 85, 247, 0.3)' },
  paris_gateway: { fill: '#10b981', stroke: '#a7f3d0', label: 'Paris Residence (LFPB)', glow: 'rgba(16, 185, 129, 0.3)' },
  wexner_hq: { fill: '#818cf8', stroke: '#c7d2fe', label: 'Wexner / Limited Brands HQ (CMH)', glow: 'rgba(129, 140, 248, 0.3)' },
  standard: { fill: '#64748b', stroke: '#cbd5e1', label: 'Destination Airport' }
};

// Calculate quadratic Bezier curved arc points
function getCurvedPath(
  p1: [number, number],
  p2: [number, number],
  numPoints: number = 24
): [number, number][] {
  const [lat1, lon1] = p1;
  const [lat2, lon2] = p2;

  const midLat = (lat1 + lat2) / 2;
  const midLon = (lon1 + lon2) / 2;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const distance = Math.sqrt(dLat * dLat + dLon * dLon);

  let nx = -dLat;
  let ny = dLon;
  const nLen = Math.sqrt(nx * nx + ny * ny);

  let ctrlLat = midLat;
  let ctrlLon = midLon;

  if (nLen > 0.0001) {
    nx /= nLen;
    ny /= nLen;
    const bendFactor = Math.min(distance * 0.16, 10);
    if (nx < 0) {
      nx = -nx;
      ny = -ny;
    }
    ctrlLat = midLat + nx * bendFactor;
    ctrlLon = midLon + ny * bendFactor;
  }

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const oneMinusT = 1 - t;
    const lat = oneMinusT * oneMinusT * lat1 + 2 * oneMinusT * t * ctrlLat + t * t * lat2;
    const lon = oneMinusT * oneMinusT * lon1 + 2 * oneMinusT * t * ctrlLon + t * t * lon2;
    points.push([lat, lon]);
  }
  return points;
}

export const FlightRouteMap: React.FC<FlightRouteMapProps> = ({
  airports,
  routes,
  searchQuery = '',
  coreOnly = false,
  selectedRouteId = null,
  onSelectRoute,
  onSelectAirport,
  onSelectCorePerson
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const airportsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeRoute, setActiveRoute] = useState<FlightRoute | null>(null);
  const [activeAirport, setActiveAirport] = useState<AirportInfo | null>(null);
  const [islandOnlyRoutes, setIslandOnlyRoutes] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Sync external selectedRouteId prop
  useEffect(() => {
    if (selectedRouteId) {
      const match = routes.find(r => r.id === selectedRouteId);
      if (match) setActiveRoute(match);
    }
  }, [selectedRouteId, routes]);

  // Filter routes based on search query, island toggle, core filter
  const visibleRoutes = useMemo(() => {
    return routes.filter(r => {
      if (islandOnlyRoutes && !r.is_island_route) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const originMatch = r.origin.toLowerCase().includes(q) || r.origin_name.toLowerCase().includes(q) || r.origin_city.toLowerCase().includes(q);
        const destMatch = r.destination.toLowerCase().includes(q) || r.dest_name.toLowerCase().includes(q) || r.dest_city.toLowerCase().includes(q);
        const passMatch = r.passengers.some(p => p.toLowerCase().includes(q));
        if (!originMatch && !destMatch && !passMatch) {
          return false;
        }
      }

      return true;
    });
  }, [routes, searchQuery, islandOnlyRoutes]);

  // Set of airport codes actively used in visible routes
  const activeAirportCodes = useMemo(() => {
    const codes = new Set<string>();
    visibleRoutes.forEach(r => {
      codes.add(r.origin);
      codes.add(r.destination);
    });
    return codes;
  }, [visibleRoutes]);

  const visibleAirports = useMemo(() => {
    return airports.filter(a => activeAirportCodes.has(a.code) || a.hub_type !== 'standard');
  }, [airports, activeAirportCodes]);

  // Connecting routes for the currently selected airport
  const selectedAirportRoutes = useMemo(() => {
    if (!activeAirport) return [];
    return routes.filter(r => r.origin === activeAirport.code || r.destination === activeAirport.code);
  }, [routes, activeAirport]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default view: North America, Caribbean & Atlantic
    const map = L.map(mapContainerRef.current, {
      center: [28.5, -68.0],
      zoom: 4,
      minZoom: 2,
      maxZoom: 14,
      worldCopyJump: true,
      zoomControl: false
    });

    // Sleek Dark Basemap from CARTO (authenticated with free API key to eliminate watermarks)
    const cartoKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_3t2t_1_2424eb687249634069b4df9f';
    const tileUrl = cartoKey
      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Zoom control placed at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer groups for dynamic swapping
    routesLayerGroupRef.current = L.layerGroup().addTo(map);
    airportsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Handle map resize nicely
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Render Flight Route Polylines
  useEffect(() => {
    if (!routesLayerGroupRef.current) return;
    routesLayerGroupRef.current.clearLayers();

    visibleRoutes.forEach(r => {
      const isSelected = activeRoute?.id === r.id;
      const arcCoords = getCurvedPath(r.origin_coords, r.dest_coords);

      // Route appearance logic
      let strokeColor = '#38bdf8';
      let strokeOpacity = Math.min(0.85, 0.25 + Math.log10(r.flight_count + 1) * 0.35);
      let weight = Math.max(1.8, Math.min(5.5, Math.log2(r.flight_count + 1) * 1.3));

      if (r.is_island_route) {
        strokeColor = '#f43f5e'; // Vibrant Rose / Red for Little St. James flights
        strokeOpacity = Math.max(0.75, strokeOpacity);
        weight = Math.max(2.5, weight);
      }

      if (isSelected) {
        strokeColor = '#fbbf24'; // Amber gold when highlighted
        strokeOpacity = 1;
        weight = 4.5;
      }

      const polyline = L.polyline(arcCoords, {
        color: strokeColor,
        weight: weight,
        opacity: strokeOpacity,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: r.is_island_route ? undefined : undefined
      });

      // Hover Tooltip
      polyline.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <div style="font-weight: 700; color: #fff;">${r.origin} ➔ ${r.destination}</div>
          <div style="color: #94a3b8; font-size: 10px;">${r.origin_city} to ${r.dest_city}</div>
          <div style="color: ${r.is_island_route ? '#f43f5e' : '#38bdf8'}; margin-top: 3px; font-weight: 600;">
            ${r.flight_count} ${r.flight_count === 1 ? 'Flight' : 'Flights'} ${r.is_island_route ? '• 🏝️ Little St. James' : ''}
          </div>
        </div>`,
        { sticky: true, className: 'leaflet-dark-tooltip' }
      );

      // Interactive Click
      polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActiveRoute(r);
        setActiveAirport(null);
        if (onSelectRoute) onSelectRoute(r);
      });

      polyline.on('mouseover', function () {
        if (!isSelected) {
          polyline.setStyle({
            weight: weight + 2,
            opacity: 1,
            color: r.is_island_route ? '#ff4d6d' : '#67e8f9'
          });
        }
      });

      polyline.on('mouseout', function () {
        if (!isSelected) {
          polyline.setStyle({
            weight: weight,
            opacity: strokeOpacity,
            color: strokeColor
          });
        }
      });

      routesLayerGroupRef.current?.addLayer(polyline);
    });
  }, [visibleRoutes, activeRoute, onSelectRoute]);

  // 3. Render Airport Circle Markers
  useEffect(() => {
    if (!airportsLayerGroupRef.current) return;
    airportsLayerGroupRef.current.clearLayers();

    visibleAirports.forEach(airport => {
      const hub = HUB_COLORS[airport.hub_type] || HUB_COLORS.standard;
      const isSelected = activeAirport?.code === airport.code;

      // Scale marker size based on traffic volume
      const radius = isSelected
        ? 12
        : Math.max(5, Math.min(14, Math.sqrt(airport.total_traffic) * 2.2));

      const marker = L.circleMarker([airport.lat, airport.lon], {
        radius: radius,
        fillColor: hub.fill,
        color: isSelected ? '#ffffff' : hub.stroke,
        weight: isSelected ? 3 : 1.5,
        opacity: 0.9,
        fillOpacity: isSelected ? 1 : 0.8
      });

      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <div style="font-weight: 800; color: #fff; font-family: monospace;">${airport.code} - ${airport.city}</div>
          <div style="color: #cbd5e1; font-size: 10px;">${airport.name}</div>
          <div style="color: ${hub.fill}; margin-top: 2px; font-weight: 600;">
            ${hub.label}
          </div>
          <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">
            Total Flights: ${airport.total_traffic} (${airport.departures} dep, ${airport.arrivals} arr)
          </div>
        </div>`,
        { sticky: true, className: 'leaflet-dark-tooltip' }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActiveAirport(airport);
        setActiveRoute(null);
        if (mapRef.current) {
          mapRef.current.panTo([airport.lat, airport.lon], { animate: true, duration: 0.5 });
        }
      });

      airportsLayerGroupRef.current?.addLayer(marker);
    });
  }, [visibleAirports, activeAirport]);

  // Jump to specific landmark coordinate
  const jumpTo = (lat: number, lon: number, zoom: number = 9) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], zoom, { duration: 1.4 });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#090a0f] select-none">
      {/* Map Header Quick Navigation Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Quick Zoom Landmark Badges */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-2xl pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
            <Compass className="w-3 h-3 text-sky-400" />
            Quick Jump:
          </span>

          <button
            onClick={() => jumpTo(18.3373, -64.9734, 10)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/60 hover:bg-rose-900 transition-all font-medium"
          >
            <span>🏝️</span>
            <span>Little St. James (TIST)</span>
          </button>

          <button
            onClick={() => jumpTo(26.6832, -80.0956, 10)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-800/60 hover:bg-amber-900 transition-all font-medium"
          >
            <span>🏖️</span>
            <span>Palm Beach (PBI)</span>
          </button>

          <button
            onClick={() => jumpTo(40.8501, -74.0608, 10)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-950/70 text-sky-300 border border-sky-800/60 hover:bg-sky-900 transition-all font-medium"
          >
            <span>🗽</span>
            <span>NYC / Teterboro (TEB)</span>
          </button>

          <button
            onClick={() => jumpTo(35.6171, -106.0894, 9)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-purple-950/70 text-purple-300 border border-purple-800/60 hover:bg-purple-900 transition-all font-medium"
          >
            <span>🏜️</span>
            <span>Zorro Ranch (SAF)</span>
          </button>

          <button
            onClick={() => jumpTo(48.9694, 2.4414, 9)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 transition-all font-medium"
          >
            <span>🗼</span>
            <span>Paris (LFPB)</span>
          </button>

          <button
            onClick={() => jumpTo(39.9980, -82.8919, 9)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900 transition-all font-medium"
          >
            <span>🏢</span>
            <span>Wexner HQ (CMH)</span>
          </button>

          <button
            onClick={() => jumpTo(28.5, -68.0, 4)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all"
          >
            <Navigation className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Island Toggle & Stats Badge */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-2xl pointer-events-auto">
          <button
            onClick={() => setIslandOnlyRoutes(!islandOnlyRoutes)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              islandOnlyRoutes
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800/80 text-rose-300 hover:bg-slate-700 border border-rose-900/50'
            }`}
          >
            <span>🏝️</span>
            <span>Island Flights Only</span>
          </button>

          <div className="text-[11px] font-mono text-slate-400 px-2 py-0.5">
            <span className="text-sky-400 font-bold">{visibleRoutes.length}</span> routes /{' '}
            <span className="text-white font-bold">{visibleAirports.length}</span> hubs
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Map Legend Overlay (Collapsible) */}
      <div className="absolute bottom-6 left-4 z-[1000] pointer-events-auto">
        {showLegend ? (
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs max-w-xs shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Aviation Legend
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hub markers legend */}
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-300/40 inline-block shrink-0" />
                <span className="text-slate-300">Little St. James Gateway (TIST)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shrink-0" />
                <span className="text-slate-300">Palm Beach Estate (PBI)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 inline-block shrink-0" />
                <span className="text-slate-300">NYC Townhouse Hub (TEB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shrink-0" />
                <span className="text-slate-300">Zorro Ranch (SAF)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="text-slate-300">Paris Le Bourget (LFPB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block shrink-0" />
                <span className="text-slate-300">Wexner / Limited HQ (CMH)</span>
              </div>
            </div>

            {/* Flight Path legend */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-rose-500 inline-block" />
                <span className="text-rose-300">Little Saint James Island Flight Path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-sky-400 inline-block" />
                <span className="text-slate-400">Domestic & International Flight Leg</span>
              </div>
              <div className="text-slate-500 italic mt-1">
                * Click any route or airport marker to inspect details
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLegend(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs shadow-xl"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Show Legend</span>
          </button>
        )}
      </div>

      {/* Route / Airport Inspection Floating Card (when item is selected) */}
      {(activeRoute || activeAirport) && (
        <div className="absolute top-16 right-4 z-[1000] w-80 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Active Route View */}
          {activeRoute && (
            <div>
              <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    {activeRoute.origin} ➔ {activeRoute.destination}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveRoute(null);
                    if (onSelectRoute) onSelectRoute(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Flight Segment:
                  </div>
                  <div className="text-slate-200 font-medium">
                    {activeRoute.origin_city} ({activeRoute.origin}) ➔ {activeRoute.dest_city} ({activeRoute.destination})
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {activeRoute.origin_name} to {activeRoute.dest_name}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-mono text-[11px]">Logged Flights:</span>
                  <span className="text-sky-400 font-bold font-mono">{activeRoute.flight_count} flights</span>
                </div>

                {activeRoute.is_island_route && (
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300 text-[11px]">
                    <span>🏝️</span>
                    <span className="font-semibold">Little Saint James Gateway Flight</span>
                  </div>
                )}

                {/* Top passengers on this route */}
                {activeRoute.top_passengers.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Frequent Flyers on this Leg:
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {activeRoute.top_passengers.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 text-slate-300"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-sky-400 font-mono text-[10px] shrink-0 ml-1">{p.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter Table Button */}
                {onSelectAirport && (
                  <button
                    onClick={() => {
                      onSelectAirport(activeRoute.destination);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>View {activeRoute.flight_count} Flights in Manifest Table ➔</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Airport View */}
          {activeAirport && (
            <div>
              <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    {activeAirport.code} - {activeAirport.city}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveAirport(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-white font-medium">{activeAirport.name}</div>
                  <div className="text-slate-400 text-[11px]">
                    {activeAirport.city}, {activeAirport.state ? `${activeAirport.state}, ` : ''}{activeAirport.country}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Hub Classification:</span>
                    <span className="font-semibold text-sky-400">{HUB_COLORS[activeAirport.hub_type]?.label || 'Airport'}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Total Traffic:</span>
                    <span className="font-mono text-white font-bold">{activeAirport.total_traffic} flights</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Departures / Arrivals:</span>
                    <span className="font-mono text-slate-300">{activeAirport.departures} dep / {activeAirport.arrivals} arr</span>
                  </div>
                </div>

                {/* Connecting routes for this airport */}
                {selectedAirportRoutes.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Connecting Flight Legs ({selectedAirportRoutes.length}):
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {selectedAirportRoutes.slice(0, 8).map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setActiveRoute(r);
                            setActiveAirport(null);
                          }}
                          className="w-full flex items-center justify-between text-[11px] bg-slate-900/80 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800/60 text-slate-300 text-left transition-colors"
                        >
                          <span className="font-mono">{r.origin} ➔ {r.destination}</span>
                          <span className="text-sky-400 font-mono text-[10px]">{r.flight_count}x</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {onSelectAirport && (
                  <button
                    onClick={() => {
                      onSelectAirport(activeAirport.code);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>View {activeAirport.total_traffic} Flights in Manifest Table ➔</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
