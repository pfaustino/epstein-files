"""
End-to-end pipeline runner for Epstein files network dataset.
Runs scraper -> enricher -> export_graph.
"""

import sys
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from src.scraper import run as run_scraper
from src.connections_scraper import run as run_connections_scraper
from src.court_and_flight_records import run as run_court_and_flight_records
from src.enricher import run as run_enricher
from src.export_graph import run as run_export_graph


def main():
    print("=========================================================")
    print("      EPSTEIN FILES DATA EXTRACTION & GRAPH PIPELINE     ")
    print("=========================================================\n")

    t0 = time.time()

    print("[Step 1/5] Ingesting Wikipedia 'Named in Files' list...")
    run_scraper()
    print("\n---------------------------------------------------------")

    print("[Step 2/5] Ingesting Wikipedia 'Connections & Orgs' article...")
    run_connections_scraper()
    print("\n---------------------------------------------------------")

    print("[Step 3/5] Ingesting Court Dockets (Does) & Flight Logs...")
    run_court_and_flight_records()
    print("\n---------------------------------------------------------")

    print("[Step 4/5] Unifying & enriching entities, properties, and relations...")
    run_enricher()
    print("\n---------------------------------------------------------")

    print("[Step 5/5] Generating multi-source graph network dataset...")
    run_export_graph()
    print("\n=========================================================")

    elapsed = time.time() - t0
    print(f"Pipeline completed successfully in {elapsed:.2f}s!")
    print("Artifacts generated:")
    print("  - data/processed/people.json   (Full structured records)")
    print("  - data/processed/people.csv    (Tabular dataset for spreadsheet/DB)")
    print("  - data/processed/graph.json    (Graph nodes & edges for Cytoscape/Force-Graph)")
    print("=========================================================")


if __name__ == "__main__":
    main()
