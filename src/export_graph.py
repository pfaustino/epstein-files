"""
Graph export script for network visualization.
Converts enriched people, organizations, properties, and relationships into
a standardized nodes-and-edges graph schema (data/processed/graph.json),
compatible with Cytoscape.js, react-force-graph, Sigma.js, and D3.js.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

PEOPLE_JSON = Path("data/processed/people.json")
GRAPH_JSON = Path("data/processed/graph.json")

# Color mapping by sector
SECTOR_COLORS = {
    "Politics, Government & Diplomacy": "#2563eb",       # Blue
    "Academia, Science & Research": "#10b981",           # Emerald
    "Finance, Business & Real Estate": "#f59e0b",        # Amber / Gold
    "Tech, Crypto & Venture Capital": "#06b6d4",         # Cyan
    "Royalty & Aristocracy": "#8b5cf6",                  # Purple
    "Entertainment, Arts & Media": "#ec4899",            # Pink
    "Law, Law Enforcement & Legal Defense": "#64748b",   # Slate Gray
    "Healthcare & Medicine": "#14b8a6",                  # Teal
    "Victims, Plaintiffs & Witnesses": "#f43f5e",        # Rose / Coral
    "Epstein Inner Circle & Staff": "#e11d48",           # Crimson
    "Public Figure / Associate": "#6b7280",              # Gray
}

LOCATION_METADATA = {
    "little_saint_james": {
        "id": "loc-little-saint-james",
        "label": "Little Saint James (Private Island)",
        "color": "#dc2626",
        "description": "Epstein's private 70-acre island in the US Virgin Islands.",
    },
    "nyc_townhouse": {
        "id": "loc-nyc-townhouse",
        "label": "NYC Townhouse (Herbert N. Straus House)",
        "color": "#ea580c",
        "description": "Epstein's 7-story, 28,000 sq ft mansion at 9 East 71st St, Manhattan.",
    },
    "palm_beach": {
        "id": "loc-palm-beach",
        "label": "Palm Beach Mansion",
        "color": "#d97706",
        "description": "Epstein's waterfront estate at 358 El Brillo Way, Palm Beach, Florida.",
    },
    "zorro_ranch": {
        "id": "loc-zorro-ranch",
        "label": "Zorro Ranch (New Mexico)",
        "color": "#ca8a04",
        "description": "Epstein's 10,000-acre ranch near Stanley, New Mexico.",
    },
    "paris": {
        "id": "loc-paris",
        "label": "Paris Apartment (Avenue Foch)",
        "color": "#7c3aed",
        "description": "Epstein's luxury apartment on Avenue Foch in Paris, France.",
    },
}


def build_graph() -> Dict[str, Any]:
    with open(PEOPLE_JSON, "r", encoding="utf-8") as f:
        people = json.load(f)

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    node_ids: Set[str] = set()
    edge_keys: Set[str] = set()

    # 1. Central Hub: Jeffrey Epstein
    hub_node = {
        "id": "jeffrey-epstein",
        "label": "Jeffrey Epstein",
        "type": "central_hub",
        "category": "Central Hub",
        "color": "#09090b",
        "size": 35,
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Mugshot_of_Jeffrey_Epstein_in_2009.jpg/250px-Mugshot_of_Jeffrey_Epstein_in_2009.jpg",
        "description": "Financier and convicted sex offender who cultivated ties with influential figures.",
    }
    nodes.append(hub_node)
    node_ids.add("jeffrey-epstein")

    # 2. Add Location Nodes
    active_locations: Set[str] = set()

    # Check which locations have connections
    for p in people:
        visits = p["property_visits"]
        if visits["island_status"] in ["Visited", "Invited", "Referenced", "Denied"]:
            active_locations.add("little_saint_james")
        if visits["townhouse_status"] in ["Visited", "Offered", "Referenced"]:
            active_locations.add("nyc_townhouse")
        if visits["palm_beach_status"] != "None":
            active_locations.add("palm_beach")
        if visits["zorro_ranch_status"] != "None":
            active_locations.add("zorro_ranch")
        if visits["paris_status"] != "None":
            active_locations.add("paris")

    for loc_key in active_locations:
        loc_info = LOCATION_METADATA[loc_key]
        loc_node = {
            "id": loc_info["id"],
            "label": loc_info["label"],
            "type": "location",
            "category": "Property / Location",
            "color": loc_info["color"],
            "size": 26,
            "description": loc_info["description"],
        }
        nodes.append(loc_node)
        node_ids.add(loc_info["id"])

        # Link location to Epstein
        edges.append({
            "id": f"epstein-owns-{loc_info['id']}",
            "source": "jeffrey-epstein",
            "target": loc_info["id"],
            "type": "OWNS_PROPERTY",
            "label": "Owned / Controlled",
            "style": "solid",
            "color": "#9ca3af",
            "weight": 2,
        })

    # 3. Add Organization Nodes
    org_nodes_map: Dict[str, str] = {}
    for p in people:
        for org in p["affiliated_organizations"]:
            if org not in org_nodes_map:
                org_id = f"org-{org.lower().replace(' ', '-').replace('/', '-').replace('.', '')}"
                org_nodes_map[org] = org_id
                nodes.append({
                    "id": org_id,
                    "label": org,
                    "type": "organization",
                    "category": "Organization / Institution",
                    "color": "#6366f1",
                    "size": 18,
                })
                node_ids.add(org_id)

    # 4. Add Person Nodes & Direct Ties to Epstein
    for p in people:
        pid = p["id"]
        sector = p["sector"]
        color = SECTOR_COLORS.get(sector, "#6b7280")
        conn = p["connection_to_epstein"]

        nodes.append({
            "id": pid,
            "label": p["name"],
            "type": "person",
            "category": sector,
            "profession": p["profession_summary"],
            "sector": sector,
            "era": conn["era"],
            "aliases": p.get("aliases", []),
            "primary_connection": conn["primary_nature"],
            "image": p["image_thumb"],
            "wikipedia_url": p["wikipedia_url"],
            "color": color,
            "size": 15 + min(len(p["connected_individuals"]) * 2, 16),
            "citations_count": p["citations_count"],
            "bio": p["full_text"],
            "source_dataset": p.get("source_dataset", "files_list"),
            "source_label": p.get("source_label", "Wikipedia: Named in Files"),
            "legal_context": p.get("legal_context", "Named in Files"),
        })
        node_ids.add(pid)

        # Edge to Epstein
        edge_id = f"{pid}-to-epstein"
        edges.append({
            "id": edge_id,
            "source": pid,
            "target": "jeffrey-epstein",
            "type": "ORBIT_TIE",
            "label": conn["primary_nature"],
            "era": conn["era"],
            "channels": conn["interaction_channels"],
            "style": "dashed" if "Mentioned" in conn["primary_nature"] else "solid",
            "color": color,
            "weight": 1,
        })

        # Edges to Locations
        visits = p["property_visits"]
        if visits["island_status"] in ["Visited", "Invited", "Denied"]:
            edges.append({
                "id": f"{pid}-island",
                "source": pid,
                "target": LOCATION_METADATA["little_saint_james"]["id"],
                "type": "PROPERTY_VISIT",
                "label": f"Island ({visits['island_status']})",
                "status": visits["island_status"],
                "notes": visits["island_notes"],
                "color": "#dc2626",
                "weight": 2,
            })

        if visits["townhouse_status"] in ["Visited", "Offered"]:
            edges.append({
                "id": f"{pid}-townhouse",
                "source": pid,
                "target": LOCATION_METADATA["nyc_townhouse"]["id"],
                "type": "PROPERTY_VISIT",
                "label": f"Townhouse ({visits['townhouse_status']})",
                "status": visits["townhouse_status"],
                "notes": visits["townhouse_notes"],
                "color": "#ea580c",
                "weight": 2,
            })

        if visits["palm_beach_status"] == "Visited / Stayed":
            edges.append({
                "id": f"{pid}-palmbeach",
                "source": pid,
                "target": LOCATION_METADATA["palm_beach"]["id"],
                "type": "PROPERTY_VISIT",
                "label": "Stayed in Palm Beach",
                "notes": visits["palm_beach_notes"],
                "color": "#d97706",
                "weight": 2,
            })

        if visits["zorro_ranch_status"] == "Visited / Stayed":
            edges.append({
                "id": f"{pid}-zorroranch",
                "source": pid,
                "target": LOCATION_METADATA["zorro_ranch"]["id"],
                "type": "PROPERTY_VISIT",
                "label": "Stayed at Zorro Ranch",
                "notes": visits["zorro_ranch_notes"],
                "color": "#ca8a04",
                "weight": 2,
            })

        if visits["paris_status"] == "Used / Stayed":
            edges.append({
                "id": f"{pid}-paris",
                "source": pid,
                "target": LOCATION_METADATA["paris"]["id"],
                "type": "PROPERTY_VISIT",
                "label": "Used Paris Apartment",
                "notes": visits["paris_notes"],
                "color": "#7c3aed",
                "weight": 2,
            })

        # Edges to Organizations
        for org in p["affiliated_organizations"]:
            org_node_id = org_nodes_map.get(org)
            if org_node_id:
                edges.append({
                    "id": f"{pid}-{org_node_id}",
                    "source": pid,
                    "target": org_node_id,
                    "type": "AFFILIATED_WITH",
                    "label": "Affiliated",
                    "color": "#818cf8",
                    "weight": 1,
                })

        # Person-to-Person Edges
        for peer in p["connected_individuals"]:
            peer_id = peer["target_id"]
            if peer_id in node_ids:
                edge_pair = tuple(sorted([pid, peer_id]))
                pair_key = f"{edge_pair[0]}<->{edge_pair[1]}"
                if pair_key not in edge_keys:
                    edge_keys.add(pair_key)
                    edges.append({
                        "id": f"peer-{pid}-{peer_id}",
                        "source": pid,
                        "target": peer_id,
                        "type": "PEER_CONNECTION",
                        "label": "Mentioned / Connected",
                        "color": "#38bdf8",
                        "weight": 2,
                    })

    # Compute degree centrality for each node
    degrees: Dict[str, int] = {n["id"]: 0 for n in nodes}
    for e in edges:
        s = e["source"]
        t = e["target"]
        if s in degrees:
            degrees[s] += 1
        if t in degrees:
            degrees[t] += 1

    for n in nodes:
        n["degree"] = degrees.get(n["id"], 0)

    return {
        "metadata": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "people_count": len(people),
            "organization_count": len(org_nodes_map),
            "location_count": len(active_locations),
            "peer_connection_count": len(edge_keys),
        },
        "nodes": nodes,
        "edges": edges,
    }


def run():
    print(f"Building graph from {PEOPLE_JSON}...")
    graph = build_graph()

    GRAPH_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(GRAPH_JSON, "w", encoding="utf-8") as f:
        json.dump(graph, f, ensure_ascii=False, indent=2)

    meta = graph["metadata"]
    print(f"Successfully generated graph schema to {GRAPH_JSON}")
    print("\n=== Graph Network Summary ===")
    print(f"Total Nodes:         {meta['total_nodes']}")
    print(f"  - People:          {meta['people_count']}")
    print(f"  - Organizations:   {meta['organization_count']}")
    print(f"  - Locations:       {meta['location_count']}")
    print(f"  - Central Hub:     1 (Jeffrey Epstein)")
    print(f"Total Edges:         {meta['total_edges']}")
    print(f"  - Mutual Peer Ties:{meta['peer_connection_count']}")


if __name__ == "__main__":
    run()
