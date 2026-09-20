"""
End-to-end pipeline runner for Epstein files network dataset.
Runs scraper -> enricher -> export_graph.
"""

import sys
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from src.scraper import run as run_scraper
from src.enricher import run as run_enricher
from src.export_graph import run as run_export_graph


def main():
    print("=========================================================")
    print("      EPSTEIN FILES DATA EXTRACTION & GRAPH PIPELINE     ")
    print("=========================================================\n")

    t0 = time.time()

    print("[Step 1/3] Scraping and parsing Wikipedia HTML...")
    run_scraper()
    print("\n---------------------------------------------------------")

    print("[Step 2/3] Enriching entities, properties, and relations...")
    run_enricher()
    print("\n---------------------------------------------------------")

    print("[Step 3/3] Generating graph network dataset (nodes & edges)...")
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
