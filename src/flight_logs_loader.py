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
            origin = route_obj.get("from", "Unknown")
            destination = route_obj.get("to", "Unknown")

            # Clean and classify route
            origin_desc = AIRPORT_MAPPINGS.get(origin, origin)
            dest_desc = AIRPORT_MAPPINGS.get(destination, destination)
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

    output_payload = {
        "metadata": {
            "source": "Pilot Flight Logs (Dave Rodgers & Larry Visoski Manifests)",
            "total_flights": len(flights),
            "total_passengers_tracked": len(leaderboard),
            "top_destinations": sorted(
                [{"destination": k, "flights": v} for k, v in destination_counts.items() if k != "Unknown"],
                key=lambda x: x["flights"],
                reverse=True
            )[:10],
        },
        "flights": flights,
        "passengers_leaderboard": leaderboard,
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
