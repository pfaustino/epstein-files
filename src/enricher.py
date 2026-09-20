"""
Enricher and entity extraction pipeline.
Processes raw parsed records into rich, structured investigative data points:
1. Connection to Epstein (nature, era, post-2008 ties)
2. Affiliated companies / organizations
3. Property visits & Island activities (Little Saint James, Townhouse, Palm Beach, etc.)
4. Profession & standardized sector classification
5. Flight travel mentions and flight counts
6. Cross-references with other named individuals
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

RAW_FILE = Path("data/raw/parsed_people_raw.json")
CONNECTIONS_FILE = Path("data/raw/parsed_connections_raw.json")
COURT_FILE = Path("data/raw/parsed_court_and_flight_records.json")
PROCESSED_DIR = Path("data/processed")
JSON_OUTPUT = PROCESSED_DIR / "people.json"
CSV_OUTPUT = PROCESSED_DIR / "people.csv"

# Standard known organizations for entity recognition
KNOWN_ORGS = {
    "MIT": ["MIT Media Lab", "Massachusetts Institute of Technology", "MIT"],
    "Harvard University": ["Harvard", "Harvard University", "Belfer Center"],
    "Columbia University": ["Columbia University", "Columbia"],
    "Bard College": ["Bard College"],
    "JPMorgan Chase": ["JPMorgan Chase", "JPMorgan", "J.P. Morgan"],
    "Apollo Global Management": ["Apollo Global Management", "Apollo"],
    "Blockstream": ["Blockstream"],
    "Palantir Technologies": ["Palantir Technologies", "Palantir"],
    "L Brands / Victoria's Secret": ["L Brands", "Victoria's Secret", "The Limited"],
    "Deutsche Bank": ["Deutsche Bank"],
    "Microsoft": ["Microsoft"],
    "Gates Foundation": ["Bill & Melinda Gates Foundation", "Gates Foundation"],
    "United Nations": ["United Nations", "UN"],
    "White House": ["White House"],
    "Edge Foundation": ["Edge.org", "Edge Foundation"],
    "CBS News": ["CBS News", "CBS"],
    "Paul Weiss": ["Paul Weiss", "Paul, Weiss"],
    "FIRST Robotics": ["FIRST", "FIRST Robotics"],
    "DEKA Research": ["DEKA"],
}

# Explicit sector overrides for prominent figures
SECTOR_OVERRIDES = {
    "Bill Clinton": "Politics, Government & Diplomacy",
    "Doug Band": "Politics, Government & Diplomacy",
    "Vitaly Churkin": "Politics, Government & Diplomacy",
    "Howard Lutnick": "Politics, Government & Diplomacy",
    "Robert Mugabe": "Politics, Government & Diplomacy",
    "John Phelan": "Politics, Government & Diplomacy",
    "Alan Dershowitz": "Law, Law Enforcement & Legal Defense",
    "Ken Starr": "Law, Law Enforcement & Legal Defense",
    "Matthew Menchel": "Law, Law Enforcement & Legal Defense",
    "Grady Judd": "Law, Law Enforcement & Legal Defense",
    "Carol Montgomery": "Law, Law Enforcement & Legal Defense",
    "Noam Chomsky": "Academia, Science & Research",
    "Jack Horner": "Academia, Science & Research",
    "Elon Musk": "Tech, Crypto & Venture Capital",
    "Peter Thiel": "Tech, Crypto & Venture Capital",
    "Adam Back": "Tech, Crypto & Venture Capital",
    "Kimbal Musk": "Finance, Business & Real Estate",
    "Leonard Blavatnik": "Finance, Business & Real Estate",
    "Nick Candy": "Finance, Business & Real Estate",
    "Francisco D'Agostino": "Finance, Business & Real Estate",
    "Julian Leese": "Finance, Business & Real Estate",
    "David Copperfield": "Entertainment, Arts & Media",
    "Deepak Chopra": "Entertainment, Arts & Media",
    "Jean Pigozzi": "Entertainment, Arts & Media",
    "Alberto Pinto and Linda Pinto": "Entertainment, Arts & Media",
    "Steve Tisch": "Entertainment, Arts & Media",
    "Mariya Prusakova": "Entertainment, Arts & Media",
    "Rony Shimony": "Healthcare & Medicine",
    "Jess Ting": "Healthcare & Medicine",
    "Steven Victor": "Healthcare & Medicine",
    "Bruce Moskowitz": "Healthcare & Medicine",
    "Stephen Alexander": "Healthcare & Medicine",
    "Peter Attia": "Healthcare & Medicine",
    "Bill Gates": "Tech, Crypto & Venture Capital",
    "Donald Trump": "Politics, Government & Diplomacy",
    "Stacey Plaskett": "Politics, Government & Diplomacy",
    "Mark Zuckerberg": "Tech, Crypto & Venture Capital",
    "Reid Hoffman": "Tech, Crypto & Venture Capital",
    "Nathan Myhrvold": "Tech, Crypto & Venture Capital",
    "Ben Goertzel": "Tech, Crypto & Venture Capital",
    "Andrew Farkas": "Finance, Business & Real Estate",
    "Ronald Lauder": "Finance, Business & Real Estate",
    "Nouriel Roubini": "Finance, Business & Real Estate",
    "John Brockman": "Entertainment, Arts & Media",
    "Mark Landon": "Healthcare & Medicine",
    "Thomas Magnani": "Healthcare & Medicine",
    "Karyna Shuliak": "Healthcare & Medicine",
    "Andrew Mountbatten-Windsor": "Royalty & Aristocracy",
    "Ghislaine Maxwell": "Finance, Business & Real Estate",
    "Sergey Brin": "Tech, Crypto & Venture Capital",
    "Joi Ito": "Academia, Science & Research",
    "Stephen Hawking": "Academia, Science & Research",
    "Boris Nikolic": "Healthcare & Medicine",
    "Thomas Pritzker": "Finance, Business & Real Estate",
    "Lynn Forester de Rothschild": "Finance, Business & Real Estate",
    "David Stern": "Entertainment, Arts & Media",
}

# Known aliases and alternative names for search matching
ALIASES = {
    "Andrew Mountbatten-Windsor": ["Prince Andrew", "Duke of York"],
    "Bill Gates": ["William Henry Gates", "William Gates", "Gates"],
    "Donald Trump": ["Trump", "Donald J. Trump", "President Trump"],
    "Bill Clinton": ["Clinton", "President Clinton", "William J. Clinton"],
    "Robert F. Kennedy Jr.": ["RFK Jr", "Bobby Kennedy", "Robert Kennedy"],
    "Mohammed bin Salman, Crown Prince of Saudi Arabia": ["MBS", "Mohammed bin Salman"],
    "Thorbjørn Jagland": ["Thorbjorn Jagland"],
    "Princess Sofia, Duchess of Värmland": ["Princess Sofia", "Duchess of Varmland"],
    "Sultan Ahmed bin Sulayem": ["Sultan bin Sulayem", "Bin Sulayem"],
    "Virginia Giuffre": ["Virginia Roberts", "Jane Doe 102", "Jane Doe 003"],
    "Sarah Kellen": ["Sarah Kensington", "Kensington"],
    "David Rodgers": ["Pilot Dave Rodgers", "Dave Rodgers"],
    "Larry Visoski": ["Pilot Larry Visoski", "Visoski"],
    "Tony Blair": ["Prime Minister Blair"],
    "John Casablancas": ["Casablancas"],
    "Murray Gell-Mann": ["Gell-Mann"],
    "JP Morgan Chase Bank": ["JPMorgan", "J.P. Morgan", "JPMorgan Chase"],
    "Deutsche Bank": ["Deutsche"],
}


def extract_profession_and_sector(name: str, text: str, category_tag: Optional[str]) -> Tuple[str, str]:
    """Extract a concise profession summary and standardized sector."""
    if name in SECTOR_OVERRIDES:
        sector = SECTOR_OVERRIDES[name]
    else:
        text_lower = text.lower()
        sector = "Public Figure / Associate"

        # Check category comment tag
        if category_tag:
            if "academic" in category_tag:
                sector = "Academia, Science & Research"
            elif "politician" in category_tag:
                sector = "Politics, Government & Diplomacy"
            elif "business" in category_tag:
                sector = "Finance, Business & Real Estate"
            elif "celebrity" in category_tag:
                sector = "Entertainment, Arts & Media"

        if sector == "Public Figure / Associate":
            if re.search(r"\b(prime minister|president|ambassador|minister|senator|governor|white house|politician|pundit|chief strategist|foreign minister|diplomat|representative to the un)\b", text_lower):
                sector = "Politics, Government & Diplomacy"
            elif re.search(r"\b(prince|princess|royal|royals|royalty|duchess|duke|dukes|queen|king|crown prince|crown princess)\b", text_lower):
                sector = "Royalty & Aristocracy"
            elif re.search(r"\b(professor|scientist|cognitive scientist|biologist|physicist|mathematician|mit|harvard|columbia|nobel|researcher|scholar|linguist|paleontologist|academic)\b", text_lower):
                sector = "Academia, Science & Research"
            elif re.search(r"\b(blockchain|tech|software|crypto|silicon valley|paypal|palantir)\b", text_lower):
                sector = "Tech, Crypto & Venture Capital"
            elif re.search(r"\b(investor|private equity|hedge fund|banker|ceo|founder|billionaire|financier|executive|venture capital|businessman|businesswoman|property developer)\b", text_lower):
                sector = "Finance, Business & Real Estate"
            elif re.search(r"\b(actor|director|filmmaker|author|journalist|model|musician|producer|magician|artist|celebrity|illusionist)\b", text_lower):
                sector = "Entertainment, Arts & Media"
            elif re.search(r"\b(lawyer|attorney|prosecutor|judge|counsel|law firm|sheriff|customs)\b", text_lower):
                sector = "Law, Law Enforcement & Legal Defense"
            elif re.search(r"\b(doctor|physician|surgeon|dermatologist|internist|psychologist|therapist)\b", text_lower):
                sector = "Healthcare & Medicine"
            elif re.search(r"\b(victim|accuser|survivor)\b", text_lower):
                sector = "Victims & Witnesses"

    # Profession summary from opening sentence, avoiding split on honorifics (Dr., Mr., etc.)
    sentences = re.split(r"(?<!\bDr)(?<!\bMr)(?<!\bMs)(?<!\bJr)(?<!\bSr)\.\s+", text)
    first_sentence = sentences[0].strip() if sentences else (text or "")
    profession = ""
    title_match = re.search(
        r"(?:is|was)\s+(?:an?|the|former)\s+([A-Za-z0-9\s,\-–—]+?)(?:\s+(?:who|whose|whom|at|when|and Epstein|\.|,))\b",
        first_sentence,
        re.IGNORECASE,
    )
    if title_match:
        profession = title_match.group(1).strip()
    elif first_sentence:
        words = first_sentence.split()
        profession = " ".join(words[:12]) + "..." if len(words) > 12 else first_sentence

    return profession, sector


def analyze_epstein_connection(text: str) -> Dict[str, Any]:
    """Analyze the nature of connection to Epstein, dates, and interaction channels."""
    text_lower = text.lower()

    nature_types = []
    # Client / Hired Epstein
    if any(w in text_lower for w in [
        "tax and estate", "hired epstein", "paid epstein", "financial advice",
        "financial adviser", "financial advisor", "managed his money", "power of attorney",
        "consulting fees", "advisory fees"
    ]):
        nature_types.append("Client (Hired Epstein)")

    # Service Provider (Hired by Epstein)
    if any(w in text_lower for w in [
        "court-approved sex-addiction doctor", "attorney", "defense lawyer",
        "pilot", "housekeeper", "butler", "represented epstein", "doctor",
        "physician", "plea deal", "non-prosecution agreement"
    ]):
        nature_types.append("Professional Service Provider")

    # Funded / Grantee
    if any(w in text_lower for w in [
        "subsidized", "funded", "funding", "donation", "grant", "gifted",
        "invested $", "investment fund", "donated money", "financial contribution"
    ]):
        nature_types.append("Financial / Funding Recipient")

    # Co-investor / Deal partner
    if any(w in text_lower for w in [
        "co-founder", "co-owned", "business opportunities", "stock tips",
        "venture", "deal", "business ties"
    ]):
        nature_types.append("Business / Investment Partner")

    # Intermediary / Introduction
    if any(w in text_lower for w in [
        "introduced by", "introduced", "connecting her to", "facilitated introductions",
        "arranged for him to meet"
    ]):
        nature_types.append("Intermediary / Introduced Others")

    # Social / Personal
    if any(w in text_lower for w in [
        "guest", "invited", "dinner", "birthday book", "texts with",
        "emails showed", "girlfriend", "longstanding relationship", "vacation trips"
    ]):
        nature_types.append("Social Acquaintance / Guest")

    # Default fallback
    if not nature_types:
        nature_types.append("Mentioned in Court Files / Email Archive")

    # Years & Era analysis
    years = [int(y) for y in re.findall(r"\b(199\d|20[0-2]\d)\b", text)]
    pre_2008 = any(y < 2008 for y in years)
    post_2008 = any(y > 2008 for y in years)

    if pre_2008 and post_2008:
        era = "Both Pre- & Post-2008"
    elif post_2008:
        era = "Post-2008 Only"
    elif pre_2008:
        era = "Pre-2008 Only"
    else:
        era = "Undated / Ongoing"

    # Communication channels
    channels = []
    if "email" in text_lower:
        channels.append("Email")
    if "text" in text_lower or "phone" in text_lower:
        channels.append("Text / Phone")
    if any(w in text_lower for w in ["met ", "meeting", "dinner", "visited"]):
        channels.append("In-Person Meetings")
    if any(w in text_lower for w in ["plane", "flight", "jet"]):
        channels.append("Private Flight")

    return {
        "relationship_types": nature_types,
        "primary_nature": nature_types[0],
        "era": era,
        "has_pre_2008_ties": pre_2008,
        "has_post_2008_ties": post_2008,
        "years_mentioned": sorted(list(set(years))),
        "interaction_channels": channels,
    }


def analyze_property_visits(text: str) -> Dict[str, Any]:
    """Detect visits and activities across Epstein's properties."""
    text_lower = text.lower()
    sentences = re.split(r"(?<=[.!?])\s+", text)

    # 1. Little Saint James / Island
    island_status = "None"
    island_notes = None
    for s in sentences:
        s_low = s.lower()
        if any(k in s_low for k in ["little saint james", "st. james", "private island", "the island", "epstein's island", "his island"]):
            island_notes = s.strip()
            if "denied" in s_low:
                island_status = "Denied"
            elif any(w in s_low for w in ["visited", "stayed", "trips to", "traveled to", "flew to", "guest on"]):
                island_status = "Visited"
            elif "invited" in s_low:
                island_status = "Invited"
            else:
                island_status = "Referenced"
            break

    # 2. NYC Townhouse / Manhattan residence
    townhouse_status = "None"
    townhouse_notes = None
    for s in sentences:
        s_low = s.lower()
        if any(k in s_low for k in ["townhouse", "upper east side residence", "herbert n. straus", "manhattan building", "residences in new york", "new york townhouse"]):
            townhouse_notes = s.strip()
            if any(w in s_low for w in ["guest at the townhouse", "visited the townhouse", "attended dinners", "frequented the building", "stayed at"]):
                townhouse_status = "Visited"
            elif "offered" in s_low:
                townhouse_status = "Offered"
            else:
                townhouse_status = "Referenced"
            break

    # 3. Palm Beach Mansion
    palm_beach_status = "None"
    palm_beach_notes = None
    for s in sentences:
        s_low = s.lower()
        if "palm beach" in s_low or "house in palm beach" in s_low:
            palm_beach_notes = s.strip()
            if any(w in s_low for w in ["spent", "days at", "house in palm beach", "visited in palm beach", "lent him", "palm beach house"]):
                palm_beach_status = "Visited / Stayed"
            else:
                palm_beach_status = "Referenced"
            break

    # 4. Zorro Ranch (New Mexico)
    zorro_ranch_status = "None"
    zorro_ranch_notes = None
    for s in sentences:
        s_low = s.lower()
        if "new mexico" in s_low or "zorro ranch" in s_low:
            zorro_ranch_notes = s.strip()
            if any(w in s_low for w in ["visited a new mexico property", "guest rooms", "stayed at", "ranch"]):
                zorro_ranch_status = "Visited / Stayed"
            elif "offered" in s_low:
                zorro_ranch_status = "Offered"
            else:
                zorro_ranch_status = "Referenced"
            break

    # 5. Paris Apartment
    paris_status = "None"
    paris_notes = None
    for s in sentences:
        s_low = s.lower()
        if "paris apartment" in s_low or "avenue foch" in s_low:
            paris_notes = s.strip()
            if any(w in s_low for w in ["lent", "stayed", "use of his paris"]):
                paris_status = "Used / Stayed"
            else:
                paris_status = "Referenced"
            break

    any_visited = any([
        island_status in ["Visited", "Invited"],
        townhouse_status in ["Visited", "Offered"],
        palm_beach_status in ["Visited / Stayed"],
        zorro_ranch_status in ["Visited / Stayed", "Offered"],
        paris_status in ["Used / Stayed"],
    ])

    return {
        "island_status": island_status,
        "island_notes": island_notes,
        "townhouse_status": townhouse_status,
        "townhouse_notes": townhouse_notes,
        "palm_beach_status": palm_beach_status,
        "palm_beach_notes": palm_beach_notes,
        "zorro_ranch_status": zorro_ranch_status,
        "zorro_ranch_notes": zorro_ranch_notes,
        "paris_status": paris_status,
        "paris_notes": paris_notes,
        "any_property_visited_or_offered": any_visited,
    }


def analyze_flight_logs(text: str) -> Dict[str, Any]:
    """Detect plane flights, private jet travel, and trip counts."""
    text_lower = text.lower()
    sentences = re.split(r"(?<=[.!?])\s+", text)

    flew_plane = False
    flight_notes = None
    flight_count_est = None

    for s in sentences:
        s_low = s.lower()
        if any(w in s_low for w in ["plane", "flight", "flew", "private jet", "lolita express"]):
            flew_plane = True
            flight_notes = s.strip()

            # Search for counts
            count_match = re.search(r"(?:at least|more than|over)?\s*(\d+)\s*(?:times|flights|trips)", s_low)
            if count_match:
                flight_count_est = int(count_match.group(1))
            elif "two vacation trips" in s_low:
                flight_count_est = 2
            break

    return {
        "flew_on_private_plane": flew_plane,
        "flight_count_estimate": flight_count_est,
        "flight_notes": flight_notes,
    }


def detect_affiliated_organizations(text: str, links: List[Dict[str, Any]]) -> List[str]:
    """Identify companies, universities, or institutions connected to this person."""
    found_orgs = set()
    text_lower = text.lower()

    for canonical, aliases in KNOWN_ORGS.items():
        for alias in aliases:
            if alias.lower() in text_lower:
                found_orgs.add(canonical)
                break

    for l in links:
        target = l.get("target", "").replace("_", " ")
        for canonical, aliases in KNOWN_ORGS.items():
            if any(alias.lower() in target.lower() for alias in aliases):
                found_orgs.add(canonical)

    return sorted(list(found_orgs))


def resolve_cross_references(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, str]]]:
    """Resolve reciprocal person-to-person connections."""
    name_to_id = {r["name"].lower(): r["id"] for r in records}
    anchor_to_id = {r["anchor"].lower(): r["id"] for r in records}
    id_to_name = {r["id"]: r["name"] for r in records}

    last_names: Dict[str, List[str]] = {}
    for r in records:
        parts = r["name"].split()
        if len(parts) >= 2:
            last = parts[-1].lower()
            last_names.setdefault(last, []).append(r["id"])

    connections: Dict[str, List[Dict[str, str]]] = {r["id"]: [] for r in records}

    for r in records:
        source_id = r["id"]
        source_text = r["full_text"]
        connected_ids: Set[str] = set()

        # In-page anchor links
        for l in r.get("links", []):
            if l.get("type") == "in_page_anchor" or "target" in l:
                target_key = l.get("target", "").lower()
                if target_key in anchor_to_id:
                    connected_ids.add(anchor_to_id[target_key])
                elif target_key in name_to_id:
                    connected_ids.add(name_to_id[target_key])
                elif target_key in last_names and len(last_names[target_key]) == 1:
                    connected_ids.add(last_names[target_key][0])

        # Text mentions of other full names and aliases
        for other in records:
            if other["id"] == source_id:
                continue
            other_name = other["name"]
            matched = False
            if len(other_name) >= 5 and re.search(r"\b" + re.escape(other_name) + r"\b", source_text, re.IGNORECASE):
                connected_ids.add(other["id"])
                matched = True
            if not matched and other_name in ALIASES:
                for alias in ALIASES[other_name]:
                    if len(alias) >= 4 and re.search(r"\b" + re.escape(alias) + r"\b", source_text, re.IGNORECASE):
                        connected_ids.add(other["id"])
                        break

        for target_id in sorted(list(connected_ids)):
            if target_id != source_id and target_id in id_to_name:
                connections[source_id].append({
                    "target_id": target_id,
                    "target_name": id_to_name[target_id],
                })

    return connections


def run():
    print(f"Loading raw records from {RAW_FILE}...")
    with open(RAW_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    if CONNECTIONS_FILE.exists():
        print(f"Loading connections records from {CONNECTIONS_FILE}...")
        with open(CONNECTIONS_FILE, "r", encoding="utf-8") as f:
            connections_records = json.load(f)
            records.extend(connections_records)

    if COURT_FILE.exists():
        print(f"Loading court & flight records from {COURT_FILE}...")
        with open(COURT_FILE, "r", encoding="utf-8") as f:
            court_records = json.load(f)
            records.extend(court_records)

    print(f"Total unified raw records: {len(records)}")

    connections_map = resolve_cross_references(records)

    enriched_records = []
    flattened_rows = []

    for r in records:
        text = r.get("full_text", "")
        category_tag = r.get("category_tag")
        name = r["name"]

        # Preserve pre-existing sector/profession or extract
        sector = r.get("sector")
        profession = r.get("profession_summary")
        if not sector or not profession:
            extracted_prof, extracted_sec = extract_profession_and_sector(name, text, category_tag)
            sector = sector or extracted_sec
            profession = profession or extracted_prof

        connection = r.get("connection_to_epstein") or analyze_epstein_connection(text)
        properties = r.get("property_visits") or analyze_property_visits(text)
        flights = r.get("flight_logs") or analyze_flight_logs(text)
        orgs = detect_affiliated_organizations(text, r.get("links", []))
        peers = connections_map.get(r["id"], [])

        source_dataset = r.get("source_dataset", "files_list")
        source_label = r.get("source_label", "Wikipedia: Named in Files")
        legal_context = r.get("legal_context", "Named in Files")

        enriched = {
            "id": r["id"],
            "name": name,
            "anchor": r.get("anchor", name.replace(" ", "_")),
            "wikipedia_url": r.get("wikipedia_url"),
            "image_thumb": r.get("image_thumb"),
            "image_full": r.get("image_full"),
            "image_caption": r.get("image_caption"),
            "category_tag": category_tag,
            "sector": sector,
            "profession_summary": profession,
            "full_text": text,
            "connection_to_epstein": connection,
            "property_visits": properties,
            "flight_logs": flights,
            "affiliated_organizations": orgs,
            "connected_individuals": peers,
            "aliases": ALIASES.get(name, []),
            "citations_count": len(r.get("citations", [])),
            "citations": r.get("citations", []),
            "source_dataset": source_dataset,
            "source_label": source_label,
            "legal_context": legal_context,
        }
        enriched_records.append(enriched)

        flattened_rows.append({
            "id": r["id"],
            "name": name,
            "source_dataset": source_dataset,
            "source_label": source_label,
            "legal_context": legal_context,
            "aliases": "; ".join(ALIASES.get(name, [])),
            "sector": sector,
            "profession": profession,
            "primary_connection_type": connection.get("primary_nature", "Unknown"),
            "all_connection_types": "; ".join(connection.get("relationship_types", [])),
            "era": connection.get("era", "Undated / Ongoing"),
            "post_2008_contact": connection.get("has_post_2008_ties", False),
            "pre_2008_contact": connection.get("has_pre_2008_ties", False),
            "island_status": properties.get("island_status", "None"),
            "island_notes": properties.get("island_notes") or "",
            "townhouse_status": properties.get("townhouse_status", "None"),
            "townhouse_notes": properties.get("townhouse_notes") or "",
            "palm_beach_status": properties.get("palm_beach_status", "None"),
            "palm_beach_notes": properties.get("palm_beach_notes") or "",
            "zorro_ranch_status": properties.get("zorro_ranch_status", "None"),
            "zorro_ranch_notes": properties.get("zorro_ranch_notes") or "",
            "paris_status": properties.get("paris_status", "None"),
            "paris_notes": properties.get("paris_notes") or "",
            "any_property_visited_or_offered": properties.get("any_property_visited_or_offered", False),
            "flew_private_plane": flights.get("flew_on_private_plane", False),
            "flight_count_estimate": flights.get("flight_count_estimate") or "",
            "flight_notes": flights.get("flight_notes") or "",
            "organizations": "; ".join(orgs),
            "connected_people_count": len(peers),
            "connected_people": "; ".join(p["target_name"] for p in peers),
            "wikipedia_url": r.get("wikipedia_url") or "",
            "has_photo": bool(r.get("image_thumb")),
            "citations_count": len(r.get("citations", [])),
            "bio_excerpt": (text[:160] + "...") if len(text) > 160 else text,
        })

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(enriched_records, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(enriched_records)} enriched records to {JSON_OUTPUT}")

    df = pd.DataFrame(flattened_rows)
    df.to_csv(CSV_OUTPUT, index=False, encoding="utf-8-sig")
    print(f"Saved tabular dataset to {CSV_OUTPUT}")

    # Dataset Insights
    print("\n=== Dataset Insights ===")
    print(f"Total individuals & entities:  {len(enriched_records)}")
    print(f"Individuals with photo:        {df['has_photo'].sum()}")
    print("\n--- By Source Dataset ---")
    print(df["source_label"].value_counts().to_string())
    print("\n--- By Standardized Sector ---")
    print(df["sector"].value_counts().to_string())
    print("\n--- By Legal / Investigative Context ---")
    print(df["legal_context"].value_counts().head(10).to_string())
    print("\n--- Little Saint James / Island Status ---")
    print(df["island_status"].value_counts().to_string())
    print(f"Total Cross-Person Edges:      {sum(len(r['connected_individuals']) for r in enriched_records)}")
    print(f"Stayed at Palm Beach:          {(df['palm_beach_status'] != 'None').sum()}")
    print(f"Stayed at Zorro Ranch (NM):    {(df['zorro_ranch_status'] != 'None').sum()}")
    print(f"Used Paris Apartment:          {(df['paris_status'] != 'None').sum()}")
    print(f"Total Cross-Person Edges:      {sum(len(r['connected_individuals']) for r in enriched_records)}")


if __name__ == "__main__":
    run()
