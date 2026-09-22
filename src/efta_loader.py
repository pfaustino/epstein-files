"""
EFTA Data Loader & Forensic Indexer.
Loads, normalizes, and enriches data from the Department of Justice
Epstein Files Transparency Act (EFTA, Public Law 119-38) research archives
(rhowardstone/Epstein-research-data and rhowardstone/Epstein-research).
"""

import json
import os
import re
import shutil

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "efta")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
WEB_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "web", "src", "data")

CATEGORY_CONFIG = {
    "overview": {"label": "📊 Executive Overviews", "order": 1},
    "individuals": {"label": "👤 Individual Investigations", "order": 2},
    "financial": {"label": "💰 Financial Forensics", "order": 3},
    "institutional": {"label": "🏛️ Institutional & Redaction Audits", "order": 4},
    "congressional": {"label": "⚖️ Congressional Briefings", "order": 5},
    "evidence": {"label": "🔍 Evidence & Device Forensics", "order": 6},
    "intelligence": {"label": "🌐 Intelligence Networks", "order": 7},
    "social-networks": {"label": "👥 Social Networks & Circles", "order": 8},
    "victims": {"label": "🛡️ Victim Census & Routes", "order": 9},
    "scientists": {"label": "🔬 Science & Academic Network", "order": 10},
    "government-officials": {"label": "🏛️ Government & Border Patrol", "order": 11},
    "art": {"label": "🎨 Art Market Transactions", "order": 12},
    "audits": {"label": "📋 Forensic Document Audits", "order": 13},
    "raw-dataset-analysis": {"label": "📁 Raw Dataset Forensic Analysis", "order": 14},
    "pqg_lines_of_investigation": {"label": "⚖️ Prosecutorial Query Graph", "order": 15},
    "internet-theories": {"label": "🔎 Fact-Checking & Theories", "order": 16},
    "methodology": {"label": "📐 Forensic Methodology", "order": 17},
    "recovered_corrupted_pdfs": {"label": "📄 Recovered Documents", "order": 18},
}

DATASET_DESCRIPTIONS = {
    1: "Initial unsealed filings, search warrant applications, and Palm Beach police exhibits.",
    2: "Early deposition exhibits, subpoena responses, and correspondence records.",
    3: "Unsealed court motions, evidentiary exhibits, and Florida grand jury materials.",
    4: "Flight manifests, contact directory excerpts, and estate inventory records.",
    5: "Subpoena compliance productions and financial transfer summaries.",
    6: "Civil litigation exhibits and witness statements from Giuffre v. Maxwell.",
    7: "Federal search warrant returns and Little Saint James property logs.",
    8: "Expanded Palm Beach Police Department investigative files and search logs.",
    9: "Extensive Palm Beach incident reports, phone toll records, and property inventories.",
    10: "Comprehensive 940,000-page SDNY release: email correspondence, FBI Vault files, and Prominent Names briefings.",
    11: "Extensive FBI 302 witness interview reports, investigative notes, and agent summaries.",
    12: "Congressional House Oversight Committee disclosures and additional estate records.",
}


def title_from_filename(filename: str) -> str:
    """Convert FILENAME_LIKE_THIS.md into a clean title."""
    name = filename.replace(".md", "")
    # Special cleanups
    name = name.replace("_", " ")
    words = name.split()
    clean_words = []
    acronyms = {"DOJ", "FBI", "EFTA", "MCC", "BOP", "SDNY", "PBPD", "DS10", "DS12", "OCR", "PDF", "CBP", "NPA"}
    for w in words:
        if w.upper() in acronyms:
            clean_words.append(w.upper())
        elif w.lower() in {"v", "vs", "and", "or", "of", "the", "in", "to", "for", "with"}:
            clean_words.append(w.lower())
        else:
            clean_words.append(w.capitalize())
    title = " ".join(clean_words)
    return title[0].upper() + title[1:] if title else ""


def build_efta_datasets():
    """Build the 12 official DOJ EFTA datasets catalog."""
    raw_path = os.path.join(RAW_DIR, "efta_datasets_raw.json")
    if not os.path.exists(raw_path):
        print(f"Warning: {raw_path} not found.")
        return []

    with open(raw_path, "r", encoding="utf-8") as f:
        raw_datasets = json.load(f)

    datasets = []
    for d in raw_datasets:
        num = d["dataset"]
        doc_count = d["efta_end"] - d["efta_start"] + 1
        desc = DATASET_DESCRIPTIONS.get(num, f"Official DOJ Epstein Files Release Dataset {num}.")
        datasets.append({
            "dataset": num,
            "name": f"DOJ Dataset {num}",
            "efta_start": d["efta_start"],
            "efta_end": d["efta_end"],
            "efta_start_formatted": d["efta_start_formatted"],
            "efta_end_formatted": d["efta_end_formatted"],
            "url_template": d["url_template"],
            "description": desc,
            "doc_count": doc_count,
            "sample_pdf_url": d["url_template"].replace("{number}", d["efta_start_formatted"]),
        })

    out_path = os.path.join(PROCESSED_DIR, "efta_datasets.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(datasets, f, indent=2)
    print(f"Exported {len(datasets)} EFTA datasets to {out_path}")
    return datasets


def build_efta_reports():
    """Build the 201 forensic reports catalog."""
    tree_path = os.path.join(RAW_DIR, "reports_tree.json")
    if not os.path.exists(tree_path):
        print(f"Warning: {tree_path} not found.")
        return []

    with open(tree_path, "r", encoding="utf-8") as f:
        tree = json.load(f)

    reports = []
    for item in tree:
        path = item["path"]
        if not path.endswith(".md") or "/" not in path:
            continue

        parts = path.split("/")
        category = parts[0]
        filename = parts[-1]
        cfg = CATEGORY_CONFIG.get(category, {"label": category.replace("-", " ").title(), "order": 99})

        slug = filename.replace(".md", "").lower().replace("_", "-")
        title = title_from_filename(filename)

        github_url = f"https://github.com/rhowardstone/Epstein-research/blob/main/{path}"
        raw_url = f"https://raw.githubusercontent.com/rhowardstone/Epstein-research/main/{path}"
        reader_url = f"https://epstein-data.com/reports/{category}/{filename.replace('.md', '.html')}"

        reports.append({
            "id": f"{category}_{slug}",
            "path": path,
            "filename": filename,
            "title": title,
            "category": category,
            "category_label": cfg["label"],
            "category_order": cfg["order"],
            "github_url": github_url,
            "raw_url": raw_url,
            "reader_url": reader_url,
            "size": item.get("size", 0),
        })

    # Sort reports by category order then title
    reports.sort(key=lambda r: (r["category_order"], r["title"]))

    out_path = os.path.join(PROCESSED_DIR, "efta_reports.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(reports, f, indent=2)
    print(f"Exported {len(reports)} forensic reports to {out_path}")
    return reports


def enrich_people_and_graph(reports):
    """Cross-reference EFTA entities & relationships to enrich people.json and graph.json."""
    ent_path = os.path.join(RAW_DIR, "knowledge_graph_entities.json")
    rel_path = os.path.join(RAW_DIR, "knowledge_graph_relationships.json")
    people_path = os.path.join(PROCESSED_DIR, "people.json")
    graph_path = os.path.join(PROCESSED_DIR, "graph.json")

    if not os.path.exists(ent_path) or not os.path.exists(rel_path):
        print("Warning: EFTA entities or relationships not found.")
        return

    with open(ent_path, "r", encoding="utf-8") as f:
        entities = json.load(f)
    with open(rel_path, "r", encoding="utf-8") as f:
        relationships = json.load(f)
    with open(people_path, "r", encoding="utf-8") as f:
        people = json.load(f)
    with open(graph_path, "r", encoding="utf-8") as f:
        graph = json.load(f)

    # 1. Build Entity Lookup Maps
    ent_by_id = {e["id"]: e for e in entities}
    ent_by_name = {}

    alias_map = {
        "leslie wexner": "les wexner",
        "prince andrew": "andrew mountbatten-windsor",
        "andrew mountbatten-windsor": "prince andrew",
        "darren indyke": "darren k. indyke",
        "richard kahn": "richard d. kahn",
        "nadia marcinko": "nadia marcinkova",
        "alessando maccioni": "alessandro maccioni",
        "jean-luc brunel": "jean luc brunel",
    }

    for e in entities:
        norm = e["name"].strip().lower()
        ent_by_name[norm] = e

    # Build relationship lookup by pair (sorted entity_id tuple)
    rel_by_pair = {}
    citations_by_entity = {}

    for r in relationships:
        s_id = r["source_entity_id"]
        t_id = r["target_entity_id"]
        pair_key = tuple(sorted([s_id, t_id]))
        rel_by_pair[pair_key] = r

        # Parse metadata
        meta_str = r.get("metadata")
        if meta_str:
            try:
                m = json.loads(meta_str)
                efta = m.get("efta")
                if efta:
                    citations_by_entity.setdefault(s_id, set()).add(efta)
                    citations_by_entity.setdefault(t_id, set()).add(efta)
                notes = m.get("notes", "")
                found_efta = re.findall(r"EFTA\d+", notes)
                for code in found_efta:
                    citations_by_entity.setdefault(s_id, set()).add(code)
                    citations_by_entity.setdefault(t_id, set()).add(code)
            except Exception:
                pass

    # Reports indexed by keywords
    reports_by_name = {}
    for r in reports:
        rtitle = r["title"].lower()
        for p in people:
            pname = p["name"].lower()
            last_name = pname.split()[-1]
            if len(last_name) >= 4 and last_name in rtitle:
                reports_by_name.setdefault(p["id"], []).append({
                    "id": r["id"],
                    "title": r["title"],
                    "category": r["category"],
                    "reader_url": r["reader_url"],
                })

    # 2. Enrich People Records
    matched_people_count = 0
    person_to_entity_id = {}

    for p in people:
        pname = p["name"].strip().lower()
        alias = alias_map.get(pname, pname)
        matched_ent = ent_by_name.get(pname) or ent_by_name.get(alias)

        if matched_ent:
            matched_people_count += 1
            e_id = matched_ent["id"]
            person_to_entity_id[p["id"]] = e_id

            meta = {}
            if matched_ent.get("metadata"):
                try:
                    meta = json.loads(matched_ent["metadata"])
                except Exception:
                    pass

            p["efta_mentions"] = meta.get("ds10_mention_count", 0)
            p["fbi_notes"] = meta.get("ds10_detail") or meta.get("source")

            # Collect citations
            cits = list(citations_by_entity.get(e_id, set()))
            p["efta_citations"] = sorted(cits)

        # Attach linked reports
        if p["id"] in reports_by_name:
            p["linked_reports"] = reports_by_name[p["id"]][:4]

    print(f"Enriched {matched_people_count} of {len(people)} core people with EFTA data.")

    # 3. Enrich Graph Edges
    enriched_edges = 0
    for edge in graph["edges"]:
        s_id = edge["source"]
        t_id = edge["target"]
        e_s = person_to_entity_id.get(s_id)
        e_t = person_to_entity_id.get(t_id)

        if e_s and e_t:
            pair = tuple(sorted([e_s, e_t]))
            rel = rel_by_pair.get(pair)
            if rel:
                enriched_edges += 1
                meta = {}
                if rel.get("metadata"):
                    try:
                        meta = json.loads(rel["metadata"])
                    except Exception:
                        pass

                edge["email_count"] = meta.get("email_count")
                edge["sent_count"] = meta.get("a_to_b")
                edge["received_count"] = meta.get("b_to_a")
                edge["date_start"] = rel.get("date_first")
                edge["date_end"] = rel.get("date_last")
                edge["bates_citation"] = meta.get("efta")
                edge["communication_notes"] = meta.get("notes") or meta.get("detail")

    print(f"Enriched {enriched_edges} core graph edges with exact communication statistics.")

    # 4. Add Extended Forensic Network Entities to Graph
    # Tag existing nodes as is_extended = False
    for n in graph["nodes"]:
        n["is_extended"] = False
    for e in graph["edges"]:
        e["is_extended"] = False

    existing_node_ids = set(n["id"] for n in graph["nodes"])
    extended_node_count = 0

    # Add entities from EFTA that aren't already in the graph
    for ent in entities:
        ent_slug = "efta-" + ent["name"].strip().lower().replace(" ", "-").replace(".", "").replace(",", "")
        if ent_slug in existing_node_ids or ent["name"].strip().lower() in ent_by_name:
            # Check if already exists in core
            if any(p["name"].strip().lower() == ent["name"].strip().lower() for p in people):
                continue

        meta = {}
        if ent.get("metadata"):
            try:
                meta = json.loads(ent["metadata"])
            except Exception:
                pass

        # Exclude redacted placeholders like '(b) (6)'
        if ent["name"].startswith("(") or ent["name"].startswith("*"):
            continue

        color = "#a855f7" if ent["entity_type"] == "organization" else "#64748b"
        node_type = "organization" if ent["entity_type"] == "organization" else "person"
        size = 14 + min(meta.get("ds10_mention_count", 0) // 10, 20)

        graph["nodes"].append({
            "id": ent_slug,
            "label": ent["name"],
            "type": node_type,
            "sector": "Forensic Associates & EFTA Entities",
            "profession": meta.get("occupation") or "Forensic Entity",
            "era": "EFTA Declassified",
            "image": None,
            "color": color,
            "size": size,
            "degree": 1,
            "bio": meta.get("ds10_detail") or f"Entity identified in DOJ EFTA declassified files with {meta.get('ds10_mention_count', 0)} mentions.",
            "legal_standing": "social_or_professional" if meta.get("person_type") != "perpetrator" else "accused_or_sued",
            "legal_standing_label": "ℹ️ EFTA Forensic Entity",
            "is_extended": True,
        })
        existing_node_ids.add(ent_slug)
        extended_node_count += 1

    print(f"Added {extended_node_count} extended forensic nodes (total nodes: {len(graph['nodes'])}).")

    # Save processed datasets
    with open(people_path, "w", encoding="utf-8") as f:
        json.dump(people, f, indent=2)
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2)


def sync_to_web():
    """Synchronize processed files into the web application data directory."""
    files_to_sync = [
        "efta_datasets.json",
        "efta_reports.json",
        "people.json",
        "graph.json",
    ]
    os.makedirs(WEB_DATA_DIR, exist_ok=True)
    for fname in files_to_sync:
        src = os.path.join(PROCESSED_DIR, fname)
        dst = os.path.join(WEB_DATA_DIR, fname)
        if os.path.exists(src):
            shutil.copyfile(src, dst)
            print(f"Synced {fname} -> {WEB_DATA_DIR}")


def main():
    print("=== Processing EFTA Forensic Datasets & Reports ===")
    datasets = build_efta_datasets()
    reports = build_efta_reports()
    enrich_people_and_graph(reports)
    sync_to_web()
    print("=== EFTA Pipeline Complete ===")


if __name__ == "__main__":
    main()
