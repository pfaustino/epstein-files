"""
Flight logs processor and manifest analyzer.
Parses 31 flight log page analyses from data/raw/flight_logs_pages/,
extracts structured flights, routes, passenger lists, computes passenger
flight frequencies/leaderboards, cross-references with core dossiers (people.json),
and exports data/processed/flight_manifests.json.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

PAGES_DIR = Path("data/raw/flight_logs_pages")
PEOPLE_PATH = Path("data/processed/people.json")
OUTPUT_FLIGHTS_PATH = Path("data/processed/flight_manifests.json")
WEB_FLIGHTS_PATH = Path("web/src/data/flight_manifests.json")

# Key airport code mappings
AIRPORT_MAPPINGS = {
    "TIST": "St. Thomas / Little St. James (USVI)",
    "STT": "St. Thomas / Little St. James (USVI)",
    "KPBI": "Palm Beach, FL",
    "PBI": "Palm Beach, FL",
    "KTEB": "Teterboro, NJ (New York Area)",
    "TEB": "Teterboro, NJ (New York Area)",
    "KJFK": "New York JFK",
    "JFK": "New York JFK",
    "KLGA": "New York LaGuardia",
    "LGA": "New York LaGuardia",
    "KSAF": "Santa Fe, NM (Zorro Ranch)",
    "SAF": "Santa Fe, NM (Zorro Ranch)",
    "LFPB": "Paris-Le Bourget, France",
    "LFPG": "Paris Charles de Gaulle, France",
    "EGGW": "London Luton, UK",
    "EGSS": "London Stansted, UK",
    "EGLL": "London Heathrow, UK",
    "KMIA": "Miami, FL",
    "MIA": "Miami, FL",
    "MYNN": "Nassau, Bahamas",
}

AIRPORTS_RAW_PATH = Path("data/raw/airports_raw.json")

SPECIAL_AIRPORTS_OVERRIDE = {
    "TIST": {"code": "TIST", "name": "Cyril E. King Airport (St. Thomas)", "city": "St. Thomas", "state": "USVI", "country": "VI", "lat": 18.3373, "lon": -64.9734, "hub_type": "island_gateway"},
    "STT": {"code": "STT", "name": "Cyril E. King Airport (St. Thomas)", "city": "St. Thomas", "state": "USVI", "country": "VI", "lat": 18.3373, "lon": -64.9734, "hub_type": "island_gateway"},
    "TEB": {"code": "TEB", "name": "Teterboro Airport", "city": "Teterboro (NYC)", "state": "NJ", "country": "US", "lat": 40.8501, "lon": -74.0608, "hub_type": "townhouse_gateway"},
    "PBI": {"code": "PBI", "name": "Palm Beach International Airport", "city": "Palm Beach", "state": "FL", "country": "US", "lat": 26.6832, "lon": -80.0956, "hub_type": "palmbeach_gateway"},
    "SAF": {"code": "SAF", "name": "Santa Fe Regional Airport", "city": "Santa Fe (Zorro Ranch)", "state": "NM", "country": "US", "lat": 35.6171, "lon": -106.089, "hub_type": "ranch_gateway"},
    "CMH": {"code": "CMH", "name": "John Glenn Columbus International", "city": "Columbus (Wexner HQ)", "state": "OH", "country": "US", "lat": 39.998, "lon": -82.8919, "hub_type": "wexner_hq"},
    "LFPB": {"code": "LFPB", "name": "Paris-Le Bourget Airport", "city": "Paris (Avenue Foch)", "state": "IDF", "country": "FR", "lat": 48.9694, "lon": 2.4414, "hub_type": "paris_gateway"},
    "EGGW": {"code": "EGGW", "name": "London Luton Airport", "city": "London", "state": "ENG", "country": "GB", "lat": 51.8747, "lon": -0.3683, "hub_type": "london_gateway"},
    "AHN": {"code": "AHN", "name": "Athens Ben Epps Airport", "city": "Athens", "state": "GA", "country": "US", "lat": 33.9519, "lon": -83.3263, "hub_type": "standard"},
    "ANH": {"code": "ANH", "name": "Athens Ben Epps Airport", "city": "Athens", "state": "GA", "country": "US", "lat": 33.9519, "lon": -83.3263, "hub_type": "standard"},
}


def build_core_lookup(people: List[Dict[str, Any]]) -> Dict[str, Dict[str, str]]:
    """Build normalized lookup for core people."""
    lookup: Dict[str, Dict[str, str]] = {}
    for p in people:
        pid = p["id"]
        canonical_name = p["name"]
        lookup[canonical_name.lower().strip()] = {"id": pid, "name": canonical_name}
        for alias in p.get("aliases", []):
            lookup[alias.lower().strip()] = {"id": pid, "name": canonical_name}
        parts = canonical_name.split()
        if len(parts) == 2:
            lookup[f"{parts[1]}, {parts[0]}".lower()] = {"id": pid, "name": canonical_name}
            lookup[f"{parts[1]} {parts[0]}".lower()] = {"id": pid, "name": canonical_name}
    return lookup


def match_passenger_name(raw_name: str, lookup: Dict[str, Dict[str, str]]) -> Optional[Dict[str, str]]:
    """Match passenger name against core people."""
    cleaned = raw_name.replace("’", "'").replace("‘", "'").strip().lower()
    if not cleaned:
        return None
    if cleaned in lookup:
        return lookup[cleaned]
    # Check without parentheses
    no_paren = re.sub(r"\(.*?\)", "", cleaned).strip()
    if no_paren in lookup:
        return lookup[no_paren]
    # Check reversed "Last, First"
    if "," in no_paren:
        parts = [p.strip() for p in no_paren.split(",", 1)]
        flipped = f"{parts[1]} {parts[0]}".strip()
        if flipped in lookup:
            return lookup[flipped]
            
    # Well-known overrides for flight passengers
    overrides = {
        "jeffrey epstein": "jeffrey-epstein",
        "epstein": "jeffrey-epstein",
        "bill clinton": "bill-clinton",
        "president clinton": "bill-clinton",
        "clinton": "bill-clinton",
        "prince andrew": "andrew-mountbatten-windsor",
        "andrew": "andrew-mountbatten-windsor",
        "ghislaine maxwell": "ghislaine-maxwell",
        "maxwell": "ghislaine-maxwell",
        "g. maxwell": "ghislaine-maxwell",
        "virginia roberts": "virginia-giuffre",
        "virginia giuffre": "virginia-giuffre",
        "emmy tayler": "emmy-tayler",
        "sarah kellen": "sarah-kellen",
        "lesley groff": "lesley-groff",
        "kevin spacey": "spacey",
        "chris tucker": "chris-tucker",
        "naomi campbell": "naomi-campbell",
        "david blaine": "blaine",
        "alan dershowitz": "alan-dershowitz",
        "jean-luc brunel": "brunel",
        "jean luc brunel": "brunel",
        "doug band": "doug-band",
        "larry summers": "summers",
        "larry visoski": "larry-visoski",
        "david rodgers": "david-rodgers",
        "eva andersson": "eva-andersson-dubin",
        "eva dubin": "eva-andersson-dubin",
        "glenn dubin": "glenn-dubin",
    }
    for k, pid in overrides.items():
        if k in no_paren:
            return {"id": pid, "name": raw_name}
            
    return None


def run():
    print(f"Loading flight log pages from {PAGES_DIR}...")
    if not PAGES_DIR.exists():
        raise FileNotFoundError(f"{PAGES_DIR} not found.")

    with open(PEOPLE_PATH, "r", encoding="utf-8") as f:
        people = json.load(f)

    core_lookup = build_core_lookup(people)

    page_files = sorted(PAGES_DIR.glob("page_*.json"))
    flights: List[Dict[str, Any]] = []
    passenger_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "name": "",
        "flight_count": 0,
        "first_flight": None,
        "last_flight": None,
        "routes": defaultdict(int),
        "co_passengers": defaultdict(int),
        "aircraft_flown": set(),
        "matched_person_id": None,
        "matched_person_name": None,
        "has_core_dossier": False,
    })

    flight_idx = 0
    destination_counts: Dict[str, int] = defaultdict(int)

    for p_file in page_files:
        with open(p_file, "r", encoding="utf-8") as f:
            p_data = json.load(f)

        page_num = p_data.get("page_number", 0)
        date_hdr = p_data.get("date_header", {}).get("full_text", "")

        for fl in p_data.get("flights", []):
            flight_idx += 1
            dt_obj = fl.get("date", {})
            date_str = dt_obj.get("parsed") or dt_obj.get("display") or dt_obj.get("original") or ""
            
            aircraft_obj = fl.get("aircraft", {})
            tail_number = aircraft_obj.get("tail_number", "Unknown")
            make_model = aircraft_obj.get("make_model", "")

            route_obj = fl.get("route", {})
            origin = (route_obj.get("from") or "Unknown").strip()
            destination = (route_obj.get("to") or "Unknown").strip()

            # Clean and classify route
            origin_desc = AIRPORT_MAPPINGS.get(origin, origin) or origin
            dest_desc = AIRPORT_MAPPINGS.get(destination, destination) or destination
            route_label = f"{origin} → {destination}"
            destination_counts[dest_desc] += 1

            # Extract flight passenger list
            flight_passengers: List[Dict[str, Any]] = []
            flight_passenger_names: List[str] = []

            for p in fl.get("passengers", []):
                p_name = p.get("name") if isinstance(p, dict) else str(p)
                p_name = p_name.strip() if p_name else ""
                if not p_name:
                    continue

                flight_passenger_names.append(p_name)
                matched = match_passenger_name(p_name, core_lookup)

                flight_passengers.append({
                    "name": p_name,
                    "matched_person_id": matched["id"] if matched else None,
                    "matched_person_name": matched["name"] if matched else None,
                    "has_core_dossier": matched is not None,
                })

                # Accumulate passenger frequency statistics
                stat = passenger_stats[p_name]
                stat["name"] = p_name
                stat["flight_count"] += 1
                stat["routes"][route_label] += 1
                if tail_number:
                    stat["aircraft_flown"].add(tail_number)

                if date_str:
                    if not stat["first_flight"] or date_str < stat["first_flight"]:
                        stat["first_flight"] = date_str
                    if not stat["last_flight"] or date_str > stat["last_flight"]:
                        stat["last_flight"] = date_str

                if matched and not stat["matched_person_id"]:
                    stat["matched_person_id"] = matched["id"]
                    stat["matched_person_name"] = matched["name"]
                    stat["has_core_dossier"] = True

            # Track co-passengers
            for p1 in flight_passenger_names:
                for p2 in flight_passenger_names:
                    if p1 != p2:
                        passenger_stats[p1]["co_passengers"][p2] += 1

            flights.append({
                "id": f"flight-{flight_idx:04d}",
                "page_number": page_num,
                "date": date_str,
                "aircraft": {
                    "tail_number": tail_number,
                    "make_model": make_model,
                },
                "route": {
                    "from": origin,
                    "to": destination,
                    "from_description": origin_desc,
                    "to_description": dest_desc,
                    "display": route_label,
                },
                "remarks": fl.get("remarks", ""),
                "passengers": flight_passengers,
                "passenger_count": len(flight_passengers),
            })

    # Prepare passenger leaderboard sorted by flight count
    leaderboard = []
    for p_name, stat in passenger_stats.items():
        # Top 3 routes
        top_routes = sorted(stat["routes"].items(), key=lambda x: x[1], reverse=True)[:3]
        # Top 3 co-passengers
        top_co_passengers = sorted(stat["co_passengers"].items(), key=lambda x: x[1], reverse=True)[:3]

        leaderboard.append({
            "name": p_name,
            "flight_count": stat["flight_count"],
            "first_flight": stat["first_flight"],
            "last_flight": stat["last_flight"],
            "aircraft_flown": sorted(list(stat["aircraft_flown"])),
            "top_routes": [{"route": r[0], "count": r[1]} for r in top_routes],
            "top_co_passengers": [{"name": cp[0], "count": cp[1]} for cp in top_co_passengers],
            "matched_person_id": stat["matched_person_id"],
            "matched_person_name": stat["matched_person_name"],
            "has_core_dossier": stat["has_core_dossier"],
        })

    leaderboard.sort(key=lambda x: x["flight_count"], reverse=True)

    # Load raw airports database
    airports_db: Dict[str, Any] = {}
    if AIRPORTS_RAW_PATH.exists():
        with open(AIRPORTS_RAW_PATH, "r", encoding="utf-8") as f:
            airports_db = json.load(f)

    def resolve_airport(c: str) -> Optional[Dict[str, Any]]:
        code_clean = c.strip().upper()
        if code_clean in SPECIAL_AIRPORTS_OVERRIDE:
            return SPECIAL_AIRPORTS_OVERRIDE[code_clean].copy()
        ap = airports_db.get(code_clean) or airports_db.get("K" + code_clean) or airports_db.get("M" + code_clean) or airports_db.get("T" + code_clean)
        if not ap:
            for k, v in airports_db.items():
                if v.get("iata") == code_clean:
                    ap = v
                    break
        if ap and ap.get("lat") and ap.get("lon"):
            return {
                "code": code_clean,
                "name": ap.get("name", code_clean),
                "city": ap.get("city", ""),
                "state": ap.get("state", ""),
                "country": ap.get("country", ""),
                "lat": float(ap["lat"]),
                "lon": float(ap["lon"]),
                "hub_type": "standard",
            }
        return None

    def extract_airport_codes(raw: str) -> List[str]:
        if not raw or not isinstance(raw, str):
            return []
        return re.findall(r"[A-Z]{3,4}", raw.upper())

    # Build airports catalog and routes map
    airports_catalog: Dict[str, Dict[str, Any]] = {}
    routes_map: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "flight_count": 0,
        "passengers": defaultdict(int),
        "flight_ids": [],
    })

    for fl in flights:
        from_raw = fl["route"]["from"]
        to_raw = fl["route"]["to"]
        from_codes = extract_airport_codes(from_raw)
        to_codes = extract_airport_codes(to_raw)

        if from_codes and to_codes:
            orig_code = from_codes[0]
            dest_code = to_codes[-1]

            orig_info = resolve_airport(orig_code)
            dest_info = resolve_airport(dest_code)

            if orig_info and dest_info:
                if orig_code not in airports_catalog:
                    orig_info["departures"] = 0
                    orig_info["arrivals"] = 0
                    orig_info["total_traffic"] = 0
                    airports_catalog[orig_code] = orig_info
                if dest_code not in airports_catalog:
                    dest_info["departures"] = 0
                    dest_info["arrivals"] = 0
                    dest_info["total_traffic"] = 0
                    airports_catalog[dest_code] = dest_info

                airports_catalog[orig_code]["departures"] += 1
                airports_catalog[orig_code]["total_traffic"] += 1
                airports_catalog[dest_code]["arrivals"] += 1
                airports_catalog[dest_code]["total_traffic"] += 1

                route_key = f"{orig_code}->{dest_code}"
                r_entry = routes_map[route_key]
                r_entry["flight_count"] += 1
                r_entry["flight_ids"].append(fl["id"])
                for p in fl["passengers"]:
                    r_entry["passengers"][p["name"]] += 1

    # Format routes list
    routes_list = []
    for route_key, r_data in routes_map.items():
        orig_code, dest_code = route_key.split("->")
        orig_info = airports_catalog[orig_code]
        dest_info = airports_catalog[dest_code]

        is_island = orig_info["hub_type"] == "island_gateway" or dest_info["hub_type"] == "island_gateway"
        top_p = sorted(r_data["passengers"].items(), key=lambda x: x[1], reverse=True)[:5]

        routes_list.append({
            "id": f"route-{orig_code}-{dest_code}",
            "origin": orig_code,
            "destination": dest_code,
            "origin_name": orig_info["name"],
            "dest_name": dest_info["name"],
            "origin_city": orig_info["city"],
            "dest_city": dest_info["city"],
            "origin_coords": [orig_info["lat"], orig_info["lon"]],
            "dest_coords": [dest_info["lat"], dest_info["lon"]],
            "flight_count": r_data["flight_count"],
            "is_island_route": is_island,
            "top_passengers": [{"name": p[0], "count": p[1]} for p in top_p],
            "passengers": list(r_data["passengers"].keys()),
            "flight_ids": r_data["flight_ids"][:30],
        })

    routes_list.sort(key=lambda x: x["flight_count"], reverse=True)

    output_payload = {
        "metadata": {
            "source": "Pilot Flight Logs (Dave Rodgers & Larry Visoski Manifests)",
            "total_flights": len(flights),
            "total_passengers_tracked": len(leaderboard),
            "total_airports_mapped": len(airports_catalog),
            "total_routes_mapped": len(routes_list),
            "top_destinations": sorted(
                [{"destination": k, "flights": v} for k, v in destination_counts.items() if k != "Unknown"],
                key=lambda x: x["flights"],
                reverse=True
            )[:10],
        },
        "flights": flights,
        "passengers_leaderboard": leaderboard,
        "airports": list(airports_catalog.values()),
        "routes": routes_list,
    }

    OUTPUT_FLIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FLIGHTS_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)

    WEB_FLIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(WEB_FLIGHTS_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {OUTPUT_FLIGHTS_PATH} & {WEB_FLIGHTS_PATH}")
    print(f"Total flights: {len(flights)}")
    print(f"Total passengers tracked: {len(leaderboard)}")
    print(f"Top 5 frequent passengers:")
    for p in leaderboard[:5]:
        print(f"  - {p['name']}: {p['flight_count']} flights (Core matched: {p['has_core_dossier']})")


if __name__ == "__main__":
    run()
