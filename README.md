# Epstein Files — Investigative Knowledge Graph & Multi-Source Explorer

[![Deploy to GitHub Pages](https://github.com/pfaustino/epstein-files/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/pfaustino/epstein-files/actions/workflows/deploy-pages.yml)

An interactive, multi-dimensional investigative suite and knowledge graph platform for exploring connections between individuals named across the Jeffrey Epstein documents, court exhibits (*Giuffre v. Maxwell*), flight manifests, and the "Little Black Book".

🌐 **Live Demo:** [https://pfaustino.github.io/epstein-files/](https://pfaustino.github.io/epstein-files/)

---

## 📑 The 5 Dedicated Investigative Tabs

```
Universal Navigation Header
├── 🌐 Tab 1: Core Network       (186 Detailed Dossiers, 606 Extended Entities & 2D Physics Graph)
├── 📖 Tab 2: The Black Book      (2,327 Address Book Directory Contacts with A–Z Jump)
├── ✈️ Tab 3: Flight Logs         (559 Recorded Flight Legs, Interactive Route Map & Leaderboard)
├── ⚖️ Tab 4: Court Does (1–187)  (Judicial Docket Index with Preska Unsealing Rulings)
└── 📑 Tab 5: EFTA Archives       (201 Topical Investigation Reports & 12 DOJ EFTA Datasets)
```

1. **🌐 Core Network Explorer (186 Curated Profiles + 606 Extended Forensic Entities)**
   - Interactive 2D physics-based force-directed knowledge graph with dynamic edge communication counts (emails, sent/received ratios, EFTA Bates stamps).
   - Avatar portraits, sector color rings, legal standing halo indicators (*Convicted*, *Indicted*, *NPA Co-Conspirator*, *Accused/Sued*, *Witness/Deponent*, *Social/Professional*).
   - **Extended Network Toggle (`🌐 Extended Network (606)`)**: Seamlessly expand the graph from the curated 186 figures to the full 606 forensic entity network with 2,302 relationships.
   - **Degrees of Separation Path Finder**: Breadth-First Search (BFS) finding shortest connection chains between any two figures.
   - **Rich Slide-Over Dossiers**: High-res portraits, cited court quotes, property visits, flight metrics, and official **DOJ EFTA Forensic Records** with Bates document citations linking directly to `justice.gov`.

2. **📖 The Black Book (2,327 Contacts across 95 Pages)**
   - Digital address book interface modeled after the 95-page contact book seized by the FBI.
   - **Alphabetical A–Z Quick Jump Bar**: One click to jump directly to any letter.
   - **Search & Category Filters**: Search names, phone numbers, addresses, and notes across Personal, Commercial, Domestic Staff, Massage/Spa, Aviation, Politics, Royalty, and Medical contacts.
   - **1-Click Cross-Linking**: 114 entries matched to core figures (*Trump*, *Clinton*, *Maxwell*, *Campbell*, *Baldwin*, *Dershowitz*, *Wexner*, *Barak*, *Spacey*, etc.) feature a glowing button: **"View Full Dossier in Core Network"**.

3. **✈️ Flight Manifests & Route Visualizer (559 Flights)**
   - **Interactive Route Map**: Geographic Leaflet visualization displaying real flight paths connecting hubs (*St. Thomas/Island*, *Palm Beach*, *Teterboro/NYC*, *Santa Fe/Ranch*, *Paris*, etc.) with curvature offsets for round trips and in-map leg inspection.
   - **Passenger Leaderboard**: Ranks 181 passengers by total recorded flight count (*Epstein* 419, *Maxwell* 207, *Dawn Devito* 37, *Sophie Biddle* 32, *Doug Band*, *Clinton*, *Prince Andrew*, *Brunel*, etc.) with date spans and co-passenger rosters.
   - Clickable passenger pills link directly to Core Network dossiers.

4. **⚖️ Court Does (1–187): Giuffre v. Maxwell**
   - Complete index of all 187 pseudonymous Does evaluated by U.S. District Judge Loretta A. Preska (Doc 1320).
   - **Status Filtering**: Toggle between **Unsealed & Identified** (181 Does) and **Protected / Maintained Under Seal** (6 Does preserved to protect minor victim safety and privacy).
   - Shows Judge Preska's balancing rationale, docket numbers, and 1-click links to core dossiers for identified figures (*Giuffre, Sjoberg, Maxwell, Andrew, Kellen, Groff, Alessi, Rodgers, Visoski, Clinton, Dershowitz, the Dubins*, etc.).

5. **📑 EFTA Archives: Investigation Reports & DOJ Datasets**
   - **201 Topical Investigation Reports**: Curated across 18 specialized categories (*Black Book & Contacts*, *Entities & Front Companies*, *Finance & Deutsche Bank*, *Aviation & Flight Logs*, *Victims & Witness Testimony*, *Key Associates*, *Co-Conspirators*, *Properties & Real Estate*, *Acquaintances*, *Unsealed Court Dockets*, etc.) with full-text search, live filtering, reader views, and direct markdown links.
   - **12 Official DOJ Declassified Datasets**: Catalog of all released EFTA series with Bates range boundaries (Dataset 1 through Dataset 12), descriptions, and official PDF links.
   - **Interactive EFTA Bates Number Locator**: Type any Bates stamp number (e.g. `EFTA00012345` or `12345`) to instantly identify the corresponding Department of Justice dataset and open the official document PDF directly on `justice.gov`.

---

## 📊 Dataset Summary

| Dataset / Tab | Total Count | Primary Source | UI View Type |
| :--- | :---: | :--- | :--- |
| **🌐 Core Network** | **186 Curated (606 Extended)** | Wikipedia Files & Connections, DOJ Forensic KG | 2D Force-Directed Graph + Directory Grid |
| **📖 The Black Book** | **2,327** | Leaked 95-Page Address Book (`epsteinsblackbook.com`) | A–Z Address Book Cards + Search |
| **✈️ Flight Logs** | **559 Flights / 181 Passengers** | Pilot Manifests (Dave Rodgers & Larry Visoski) | Interactive Route Map + Leaderboard + Manifests |
| **⚖️ Court Does** | **187 Does** | *Giuffre v. Maxwell* (Doc 1320 Unsealing Orders) | Judicial Index Cards + Seal Statuses |
| **📑 EFTA Archives** | **201 Reports & 12 Datasets** | DOJ Epstein File Releases & Forensic Indexes | Report Catalog + EFTA Bates Locator Calculator |

---

## 📁 Repository Structure

```
epstein-files/
├── .github/workflows/
│   └── deploy-pages.yml                # Automatic build & deploy to GitHub Pages
├── main.py                             # 9-step automated data pipeline orchestrator
├── pyproject.toml                      # Python dependencies (BeautifulSoup, pandas, httpx)
├── src/
│   ├── scraper.py                      # Scrapes Wikipedia: List of people named in Epstein files
│   ├── connections_scraper.py          # Scrapes Wikipedia: Connections of Jeffrey Epstein
│   ├── court_and_flight_records.py     # Ingests Giuffre v. Maxwell court dockets & flight manifests
│   ├── enricher.py                     # Unifies 3 raw sources, aliases, sectors, eras, and mutual peer ties
│   ├── export_graph.py                 # Graph export with degree centrality and node/edge schemas
│   ├── black_book_loader.py            # Processes 2,327 address book entries from FBI files
│   ├── flight_logs_loader.py           # Processes 559 flight records and passenger rankings
│   ├── court_does_loader.py            # Indexes 187 Court Does from Judge Preska's orders
│   └── efta_loader.py                  # Ingests 201 reports, 12 DOJ datasets, 606 forensic entities & email edges
├── data/
│   ├── raw/                            # Cached HTML, EFTA JSON, and source datasets
│   └── processed/                      # Output JSON & CSV files
└── web/                                # React 19 + TypeScript + Vite 6 + Tailwind CSS app
    ├── src/
    │   ├── types.ts                    # TypeScript schemas for all 5 datasets
    │   ├── App.tsx                     # Top-level state & cross-tab navigation
    │   ├── components/
    │   │   ├── Header.tsx              # Universal 5-tab header
    │   │   ├── FilterBar.tsx           # Sector, source, legal standing, & extended network filters
    │   │   ├── NetworkGraph.tsx        # 2D canvas physics graph with extended toggle & email counts
    │   │   ├── DirectoryView.tsx       # Core directory card catalog
    │   │   ├── DossierDrawer.tsx       # Biographical dossier with DOJ EFTA citations
    │   │   ├── PathFinderModal.tsx     # Degrees of separation shortest-path finder
    │   │   ├── BlackBookView.tsx       # A–Z digital address book
    │   │   ├── FlightLogsView.tsx      # Interactive flight route map & passenger leaderboard
    │   │   ├── CourtDoesView.tsx       # Judicial Does index (1–187)
    │   │   └── EftaReportsView.tsx     # 201 reports library & DOJ Bates locator calculator
    │   └── data/                       # Bundled datasets (people, graph, black_book, flights, does, efta)
    └── package.json
```

---

## 🚀 Quick Start & Local Setup

### 1. Run the Python Data Pipeline
```bash
# Requires Python 3.12+ (or uv)
python main.py
```

### 2. Run the Web App Locally
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚖️ Legal & Journalistic Disclaimer
Inclusion of any individual's name in released court files, depositions, address books, or flight manifests does not imply wrongdoing, illegality, or complicity. The records encompass alleged victims, accusers, witnesses, medical personnel, legal defense counsel, household employees, aviation staff, and casual acquaintances alongside investigative subjects. Figures appearing in depositions purely as incidental questions (e.g. witnesses confirming they never met them) are prominently flagged with disclaimer notices.

---

## 📄 License
MIT License.
