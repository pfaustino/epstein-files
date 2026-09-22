# Epstein Files — Investigative Knowledge Graph & Multi-Source Explorer

[![Deploy to GitHub Pages](https://github.com/pfaustino/epstein-files/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/pfaustino/epstein-files/actions/workflows/deploy-pages.yml)

An interactive, multi-dimensional investigative suite and knowledge graph platform for exploring connections between individuals named across the Jeffrey Epstein documents, court exhibits (*Giuffre v. Maxwell*), flight manifests, and the "Little Black Book".

🌐 **Live Demo:** [https://pfaustino.github.io/epstein-files/](https://pfaustino.github.io/epstein-files/)

---

## 📑 The 4 Dedicated Investigative Tabs

```
Universal Navigation Header
├── 🌐 Tab 1: Core Network       (186 Detailed Dossiers & 2D Physics Knowledge Graph)
├── 📖 Tab 2: The Black Book      (2,327 Address Book Directory Contacts with A–Z Jump)
├── ✈️ Tab 3: Flight Logs         (559 Recorded Flight Legs & 181-Passenger Leaderboard)
└── ⚖️ Tab 4: Court Does (1–187)  (Judicial Docket Index with Preska Unsealing Rulings)
```

1. **🌐 Core Network Explorer (186 Profiles & Hub)**
   - Interactive 2D physics-based force-directed knowledge graph (210 nodes, 564 edges, 105 mutual peer ties).
   - Avatar portraits, sector color rings, and property nodes (*Little Saint James*, *NYC Townhouse*, *Palm Beach*, *Zorro Ranch*, *Paris*).
   - Sub-views: Toggle between interactive **Graph View** and **Directory Grid**.
   - **Degrees of Separation Path Finder**: Breadth-First Search (BFS) finding shortest connection chains between any two figures.
   - **Rich Slide-Over Dossiers**: High-res portraits, cited court quotes, property visits, flight metrics, and 1-click peer navigation.

2. **📖 The Black Book (2,327 Contacts across 95 Pages)**
   - Digital address book interface modeled after the 95-page contact book seized by the FBI.
   - **Alphabetical A–Z Quick Jump Bar**: One click to jump directly to any letter.
   - **Search & Category Filters**: Search names, phone numbers, addresses, and notes across Personal, Commercial, Domestic Staff, Massage/Spa, Aviation, Politics, Royalty, and Medical contacts.
   - **1-Click Cross-Linking**: 114 entries matched to core figures (*Trump*, *Clinton*, *Maxwell*, *Campbell*, *Baldwin*, *Dershowitz*, *Wexner*, *Barak*, *Spacey*, etc.) feature a glowing button: **"View Full Dossier in Core Network"**.

3. **✈️ Flight Manifests & Pilot Logs (559 Flights)**
   - **Passenger Leaderboard**: Ranks 181 passengers by total recorded flight count (*Epstein* 419, *Maxwell* 207, *Dawn Devito* 37, *Sophie Biddle* 32, *Doug Band*, *Clinton*, *Prince Andrew*, *Brunel*, etc.) with flight date spans, frequent flight legs, and co-passenger analysis.
   - **Flight Manifests Table**: Detailed log table with airport/route filters (*St. Thomas / Island*, *Palm Beach*, *Teterboro / NYC*, *Santa Fe / Ranch*, *Paris*), flight dates, tail numbers, and full passenger rosters.
   - Clickable passenger pills link directly to Core Network dossiers.

4. **⚖️ Court Does (1–187): Giuffre v. Maxwell**
   - Complete index of all 187 pseudonymous Does evaluated by U.S. District Judge Loretta A. Preska (Doc 1320).
   - **Status Filtering**: Toggle between **Unsealed & Identified** (181 Does) and **Protected / Maintained Under Seal** (6 Does preserved to protect minor victim safety and privacy).
   - Shows Judge Preska's balancing rationale, docket numbers, and 1-click links to core dossiers for identified figures (*Giuffre, Sjoberg, Maxwell, Andrew, Kellen, Groff, Alessi, Rodgers, Visoski, Clinton, Dershowitz, the Dubins*, etc.).

---

## 📊 Dataset Summary

| Dataset / Tab | Total Count | Primary Source | UI View Type |
| :--- | :---: | :--- | :--- |
| **🌐 Core Network** | **186** | Wikipedia Files & Connections, High-Profile Court Mentions | 2D Force-Directed Graph + Directory Grid |
| **📖 The Black Book** | **2,327** | Leaked 95-Page Address Book (`epsteinsblackbook.com`) | A–Z Address Book Cards + Search |
| **✈️ Flight Logs** | **559 Flights / 181 Passengers** | Pilot Manifests (Dave Rodgers & Larry Visoski) | Leaderboard + Flight Manifest Table |
| **⚖️ Court Does** | **187 Does** | *Giuffre v. Maxwell* (Doc 1320 Unsealing Orders) | Judicial Index Cards + Seal Statuses |

---

## 📁 Repository Structure

```
epstein-files/
├── .github/workflows/
│   └── deploy-pages.yml                # Automatic build & deploy to GitHub Pages
├── main.py                             # 8-step automated data pipeline orchestrator
├── pyproject.toml                      # Python dependencies (BeautifulSoup, pandas, httpx)
├── src/
│   ├── scraper.py                      # Scrapes Wikipedia: List of people named in Epstein files
│   ├── connections_scraper.py          # Scrapes Wikipedia: Connections of Jeffrey Epstein
│   ├── court_and_flight_records.py     # Ingests Giuffre v. Maxwell court dockets & flight manifests
│   ├── enricher.py                     # Unifies 3 raw sources, aliases, sectors, eras, and mutual peer ties
│   ├── export_graph.py                 # Graph export with degree centrality and node/edge schemas
│   ├── black_book_loader.py            # Processes 2,327 address book entries from FBI files
│   ├── flight_logs_loader.py           # Processes 559 flight records and passenger rankings
│   └── court_does_loader.py            # Indexes 187 Court Does from Judge Preska's orders
├── data/
│   ├── raw/                            # Cached HTML and source JSON
│   └── processed/                      # Output JSON & CSV files
└── web/                                # React 19 + TypeScript + Vite 6 + Tailwind CSS app
    ├── src/
    │   ├── types.ts                    # TypeScript schemas for all 4 datasets
    │   ├── App.tsx                     # Top-level state & cross-tab navigation
    │   ├── components/
    │   │   ├── Header.tsx              # Universal 4-tab header
    │   │   ├── FilterBar.tsx           # Sector & dataset multi-pill filters
    │   │   ├── NetworkGraph.tsx        # 2D canvas physics graph
    │   │   ├── DirectoryView.tsx       # Core directory card catalog
    │   │   ├── DossierDrawer.tsx       # Slide-over biographical dossier
    │   │   ├── PathFinderModal.tsx     # Degrees of separation shortest-path finder
    │   │   ├── BlackBookView.tsx       # A–Z digital address book
    │   │   ├── FlightLogsView.tsx      # Manifests & passenger leaderboard
    │   │   └── CourtDoesView.tsx       # Judicial Does index (1–187)
    │   └── data/                       # Bundled datasets (people, graph, black_book, flights, does)
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
