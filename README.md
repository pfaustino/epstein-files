# Epstein Files - Investigative Knowledge Graph & Data Pipeline

A structured data extraction, entity resolution, and network graph generator for the individuals named in the Epstein documents, court exhibits, and reliable investigative archives.

Data sourced from [Wikipedia: List of people named in the Epstein files](https://en.wikipedia.org/wiki/List_of_people_named_in_the_Epstein_files), enriched with standardized taxonomies, cross-references, property visit tracking, and flight log data.

---

## 📊 Dataset Overview

| Metric | Count |
| :--- | :--- |
| **Total Named Individuals** | **157** |
| **Individuals with Portrait Photos** | **109** (69.4%) |
| **Individuals Linked to Wikipedia Pages** | **141** (89.8%) |
| **Standardized Sectors** | **8** |
| **Total Graph Nodes** | **181** (157 People + 18 Organizations + 5 Locations + 1 Central Hub) |
| **Total Graph Edges** | **426** (including 57 direct person-to-person peer connections) |
| **Document Citations Tracked** | **449** |

---

## 📁 Repository Structure

```
epstein-files/
├── main.py                     # One-click end-to-end pipeline runner
├── pyproject.toml              # Dependencies managed via uv
├── .gitignore
├── src/
│   ├── scraper.py              # Fetches and parses Wikipedia HTML into raw records
│   ├── enricher.py             # Entity extraction, sectors, eras, and properties
│   └── export_graph.py         # Formats nodes & edges for Cytoscape / Force-Graph
├── data/
│   ├── raw/
│   │   ├── wikipedia_page.html       # Cached Wikipedia page HTML
│   │   └── parsed_people_raw.json    # Intermediate raw parsed entities
│   └── processed/
│       ├── people.json         # Rich hierarchical JSON with all fields & citations
│       ├── people.csv          # Tabular dataset for Excel, DuckDB, or Pandas
│       └── graph.json          # Ready-to-visualize network graph (nodes & edges)
└── README.md
```

---

## 🧬 Extracted Data Fields

### Core Person Attributes
- **`id`**: Unique kebab-case slug (e.g. `woody-allen`, `leon-black`).
- **`name`**: Full name of the individual.
- **`sector`**: Standardized sector classification:
  - `Politics, Government & Diplomacy` (38)
  - `Academia, Science & Research` (31)
  - `Finance, Business & Real Estate` (30)
  - `Entertainment, Arts & Media` (20)
  - `Royalty & Aristocracy` (20)
  - `Law, Law Enforcement & Legal Defense` (7)
  - `Healthcare & Medicine` (6)
  - `Tech, Crypto & Venture Capital` (5)
- **`profession_summary`**: Concise title or role (e.g. *"Professor of Biology at Columbia University"*, *"Former Prime Minister of Israel"*).
- **`wikipedia_url`**: Direct link to their standalone Wikipedia biography.
- **`image_thumb` & `image_full`**: Wikimedia Commons thumbnail and full-resolution portrait image URLs.
- **`citations_count` & `citations`**: Source footnotes referencing court exhibits, investigative articles, and legal filings.

### 1. Connection to Epstein
- **`primary_connection_type`**: Primary nature of the relationship:
  - `Client (Hired Epstein)`: Paid Epstein for tax/estate/financial management (e.g. Leon Black, Leslie Wexner).
  - `Professional Service Provider`: Hired by Epstein (e.g. doctors, lawyers, pilots).
  - `Financial / Funding Recipient`: Received donations, grants, or seed investments (e.g. MIT Media Lab, Harvard, Blockstream).
  - `Business / Investment Partner`: Co-investors, deal partners, corporate ties.
  - `Intermediary / Introduced Others`: Facilitated introductions to officials or other high-profile figures.
  - `Social Acquaintance / Guest`: Dinners, parties, social correspondence.
  - `Mentioned in Court Files / Email Archive`: Documented in unsealed depositions.
- **`era`**: Connection timeframe:
  - `Post-2008 Only`: Interactions began or continued *after* Epstein's 2008 Florida conviction (critical for public scrutiny).
  - `Both Pre- & Post-2008`: Longstanding ties spanning decades.
  - `Pre-2008 Only`: Interactions confined to before the 2008 conviction.

### 2. Properties & Island Activities
- **Little Saint James (Private Island, USVI)**:
  - `Visited`: Confirmed visit or multiple trips.
  - `Invited`: Formally invited.
  - `Denied`: Explicitly denied visiting.
- **NYC Townhouse (Herbert N. Straus House, 9 E 71st St, Manhattan)**:
  - Dinners, overnight stays, meetings.
- **Palm Beach Waterfront Estate (Florida)**:
  - Extended stays, visits, medical/administrative visits.
- **Zorro Ranch (Stanley, New Mexico)**:
  - Guest rooms, scientific retreats, vacation visits.
- **Paris Apartment (Avenue Foch)**:
  - Lent to associates, stays.

### 3. Flight Logs & Private Aircraft
- **`flew_private_plane`**: Boolean flag indicating travel on Epstein's aircraft (*"Lolita Express"* / Boeing 727 / Gulfstream).
- **`flight_count_estimate`**: Documented trip counts (e.g. Doug Band: >35 flights; Jean-Luc Brunel: 25 flights; Eva Andersson-Dubin: 18 flights; Bill Clinton: 16 flights).
- **`flight_notes`**: Direct textual evidence snippet.

### 4. Cross-Referenced Entities
- **Connected Individuals (`connected_people`)**: Mutual connections, joint meetings, and introductions between figures on the list.
- **Affiliated Organizations**: Linked universities (Harvard, MIT, Columbia, Bard), corporations (Apollo, JPMorgan, Blockstream, Palantir), and government bodies.

---

## 🚀 Quick Start & Usage

### Prerequisites
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (fast Python package installer & runner)

### Running the Pipeline
To run the entire pipeline end-to-end:
```bash
uv run python main.py
```

### Running Individual Steps
1. **Scraper**:
   ```bash
   uv run python src/scraper.py
   ```
2. **Enricher**:
   ```bash
   uv run python src/enricher.py
   ```
3. **Graph Exporter**:
   ```bash
   uv run python src/export_graph.py
   ```

---

## 🕸 Graph Data Schema (`graph.json`)

The output `data/processed/graph.json` conforms to standard force-directed graph formats:

```json
{
  "nodes": [
    {
      "id": "woody-allen",
      "label": "Woody Allen",
      "type": "person",
      "category": "Entertainment, Arts & Media",
      "color": "#ec4899",
      "size": 19,
      "degree": 5,
      "image": "https://upload.wikimedia.org/...",
      "wikipedia_url": "https://en.wikipedia.org/wiki/Woody_Allen"
    },
    {
      "id": "loc-little-saint-james",
      "label": "Little Saint James (Private Island)",
      "type": "location",
      "color": "#dc2626",
      "size": 26
    }
  ],
  "edges": [
    {
      "id": "peer-woody-allen-larry-summers",
      "source": "woody-allen",
      "target": "larry-summers",
      "type": "PEER_CONNECTION",
      "label": "Mentioned / Connected",
      "color": "#38bdf8",
      "weight": 2
    }
  ]
}
```

---

## ⚖️ Journalistic & Legal Notice
Inclusion in released court files, flight manifests, or this dataset does not inherently establish illegal conduct or personal misconduct. Context matters: the files contain victims, accusers, witnesses, medical professionals, legal defense counsel, employees, and social acquaintances alongside investigative subjects.
