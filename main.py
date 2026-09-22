"""
End-to-end pipeline runner for Epstein files multi-source investigative dataset.
Runs:
1. scraper (Wikipedia Named in Files)
2. connections_scraper (Wikipedia Connections & Orgs)
3. court_and_flight_records (High-profile Court Does & Flight figures)
4. enricher (Unification, Sectors, Eras, Peer Ties)
5. export_graph (Knowledge Graph Schema)
6. black_book_loader (Epstein's Address Book ~2,327 entries)
7. flight_logs_loader (Aviation Manifests & Passenger Leaderboard)
8. court_does_loader (Giuffre v. Maxwell Does 1–187 Index)
"""

import shutil
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from src.scraper import run as run_scraper
from src.connections_scraper import run as run_connections_scraper
from src.court_and_flight_records import run as run_court_and_flight_records
from src.enricher import run as run_enricher
from src.export_graph import run as run_export_graph
from src.black_book_loader import run as run_black_book_loader
from src.flight_logs_loader import run as run_flight_logs_loader
from src.court_does_loader import run as run_court_does_loader
from src.efta_loader import main as run_efta_loader


def sync_to_web():
    """Copy processed datasets to web/src/data/ for Vite bundling."""
    src_dir = Path("data/processed")
    dest_dir = Path("web/src/data")
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    files = [
        "people.json",
        "graph.json",
        "black_book.json",
        "flight_manifests.json",
        "court_does.json",
        "efta_datasets.json",
        "efta_reports.json",
    ]
    for fname in files:
        s = src_dir / fname
        d = dest_dir / fname
        if s.exists():
            shutil.copy2(s, d)
            print(f"Synced {s} -> {d}")


def main():
    print("=========================================================")
    print("      EPSTEIN FILES DATA EXTRACTION & GRAPH PIPELINE     ")
    print("=========================================================\n")

    t0 = time.time()

    print("[Step 1/9] Ingesting Wikipedia 'Named in Files' list...")
    run_scraper()
    print("\n---------------------------------------------------------")

    print("[Step 2/9] Ingesting Wikipedia 'Connections & Orgs' article...")
    run_connections_scraper()
    print("\n---------------------------------------------------------")

    print("[Step 3/9] Ingesting Court Dockets (Does) & Flight Logs...")
    run_court_and_flight_records()
    print("\n---------------------------------------------------------")

    print("[Step 4/9] Unifying & enriching entities, properties, and relations...")
    run_enricher()
    print("\n---------------------------------------------------------")

    print("[Step 5/9] Generating multi-source graph network dataset...")
    run_export_graph()
    print("\n---------------------------------------------------------")

    print("[Step 6/9] Processing Epstein's Address Book (The 'Little Black Book')...")
    run_black_book_loader()
    print("\n---------------------------------------------------------")

    print("[Step 7/9] Processing Flight Logs & Aviation Manifests...")
    run_flight_logs_loader()
    print("\n---------------------------------------------------------")

    print("[Step 8/9] Generating Court Does (1–187) Judicial Index...")
    run_court_does_loader()
    print("\n---------------------------------------------------------")

    print("[Step 9/9] Ingesting EFTA Forensic Datasets & 201 Investigation Reports...")
    run_efta_loader()
    print("\n---------------------------------------------------------")

    print("Synchronizing all datasets to web application...")
    sync_to_web()
    print("\n=========================================================")

    elapsed = time.time() - t0
    print(f"Pipeline completed successfully in {elapsed:.2f}s!")
    print("Artifacts generated in data/processed/ and web/src/data/:")
    print("  - people.json          (186 enriched dossiers)")
    print("  - graph.json           (746 nodes including extended network)")
    print("  - black_book.json      (2,327 address book entries)")
    print("  - flight_manifests.json(559 flights, 181 passengers)")
    print("  - court_does.json      (187 court does)")
    print("  - efta_datasets.json   (12 official DOJ datasets)")
    print("  - efta_reports.json    (201 forensic investigation reports)")
    print("=========================================================")


if __name__ == "__main__":
    main()
