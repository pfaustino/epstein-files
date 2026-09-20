"""
Loader and processor for Jeffrey Epstein's digitized "Little Black Book".
Parses data/raw/black_book_raw.json (2,327 entries across 95 pages),
normalizes contact details, assigns categories, cross-references with
core dossier figures (people.json), and exports data/processed/black_book.json.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

RAW_BB_PATH = Path("data/raw/black_book_raw.json")
PEOPLE_PATH = Path("data/processed/people.json")
OUTPUT_BB_PATH = Path("data/processed/black_book.json")
WEB_BB_PATH = Path("web/src/data/black_book.json")

SERVICE_KEYWORDS = [
    "aviation", "hotel", "restaurant", "catering", "service", "massage",
    "hair", "salon", "cleaner", "limo", "travel", "charter", "yacht",
    "doctor", "dr.", "dental", "clinic", "hospital", "bank", "security",
    "property", "realty", "repair", "plumbing", "contractor", "florist",
    "ticket", "office", "store", "gallery"
]


def clean_name(raw_name: str) -> str:
    """Clean OCR artifacts, question marks, and prefixes from contact names."""
    if not raw_name:
        return ""
    name = raw_name.replace("’", "'").replace("‘", "'").replace("?", "").strip()
    # Remove leading category prefixes like 'Jeffrey – ', 'PB – ', 'Island – '
    name = re.sub(r"^(?:jeffrey|pb|island|ny|palm beach|london)\s*[–—\-]\s*", "", name, flags=re.IGNORECASE)
    return name.strip()


def categorize_entry(name: str, notes: List[str], section: str) -> str:
    """Infer category for an address book entry."""
    lower_text = f"{name} {' '.join(notes)}".lower()
    
    if "massage" in lower_text:
        return "Massage / Spa"
    if any(k in lower_text for k in ["aviation", "pilot", "flight", "plane", "aircraft", "jet"]):
        return "Aviation & Travel"
    if any(k in lower_text for k in ["houseman", "butler", "maid", "chef", "cook", "driver", "security", "assistant"]):
        return "Household & Staff"
    if any(k in lower_text for k in ["hotel", "restaurant", "realty", "property", "gallery", "bank", "repair"]):
        return "Commercial / Service"
    if any(k in lower_text for k in ["senator", "governor", "president", "ambassador", "minister", "prime minister"]):
        return "Politics & Government"
    if any(k in lower_text for k in ["prince", "princess", "duke", "duchess", "lord", "lady", "baron"]):
        return "Royalty & Nobility"
    if any(k in lower_text for k in ["dr.", "doctor", "prof.", "professor", "phd", "md"]):
        return "Medical & Academic"
    return "Personal / Social Contact"


def build_core_lookup(people: List[Dict[str, Any]]) -> Dict[str, Dict[str, str]]:
    """Create normalized name lookup table for matching against core dossiers."""
    lookup: Dict[str, Dict[str, str]] = {}
    for p in people:
        pid = p["id"]
        canonical_name = p["name"]
        
        # Exact lowercase
        lookup[canonical_name.lower().strip()] = {"id": pid, "name": canonical_name}
        
        # Aliases
        for alias in p.get("aliases", []):
            lookup[alias.lower().strip()] = {"id": pid, "name": canonical_name}
            
        # First Last -> Last First
        parts = canonical_name.split()
        if len(parts) == 2:
            last_first = f"{parts[1]}, {parts[0]}".lower()
            lookup[last_first] = {"id": pid, "name": canonical_name}
            last_first_nocomma = f"{parts[1]} {parts[0]}".lower()
            lookup[last_first_nocomma] = {"id": pid, "name": canonical_name}
            
    return lookup


def match_core_profile(name: str, lookup: Dict[str, Dict[str, str]]) -> Optional[Dict[str, str]]:
    """Match address book contact name against core dossier lookup table."""
    cleaned = clean_name(name).lower()
    if not cleaned:
        return None
        
    # Direct match
    if cleaned in lookup:
        return lookup[cleaned]
        
    # Check without parenthetical notes, e.g. "Bands, Doug (Clinton's scheduler)"
    no_paren = re.sub(r"\(.*?\)", "", cleaned).strip()
    if no_paren in lookup:
        return lookup[no_paren]
        
    # Check "Last, First" reversed
    if "," in no_paren:
        parts = [p.strip() for p in no_paren.split(",", 1)]
        flipped = f"{parts[1]} {parts[0]}".strip()
        if flipped in lookup:
            return lookup[flipped]
            
    # Check 2 words "Last First" reversed
    words = no_paren.split()
    if len(words) == 2:
        flipped = f"{words[1]} {words[0]}"
        if flipped in lookup:
            return lookup[flipped]
            
    # Special manual overrides for well-known entries in the Black Book
    special_matches = {
        "trump, donald": "donald-trump",
        "trump donald": "donald-trump",
        "clinton, bill": "bill-clinton",
        "clinton bill": "bill-clinton",
        "bands, doug": "doug-band",
        "band, doug": "doug-band",
        "baldwin alec": "alec-baldwin",
        "jagger mick": "mick-jagger",
        "hoffman, dustin": "dustin-hoffman",
        "kennedy, bobby": "robert-f.-kennedy-jr.",
        "spacey, kevin": "spacey",
        "wexner, les": "les-wexner",
        "dershowitz, alan": "alan-dershowitz",
        "barak, ehud": "ehud-barak",
        "blaine david": "blaine",
        "briatore, flavio": "briatore",
        "campbell, naomi": "naomi-campbell",
        "siegal, peggy": "siegal",
        "pritzker, thomas": "thomas-pritzker",
        "ito joi": "joi-ito",
        "ito, joi": "joi-ito",
    }
    
    for k, target_id in special_matches.items():
        if k in no_paren:
            return {"id": target_id, "name": name}
            
    return None


def run():
    print(f"Loading raw Black Book from {RAW_BB_PATH}...")
    if not RAW_BB_PATH.exists():
        raise FileNotFoundError(f"{RAW_BB_PATH} not found.")

    with open(RAW_BB_PATH, "r", encoding="utf-8") as f:
        bb_raw = json.load(f)

    with open(PEOPLE_PATH, "r", encoding="utf-8") as f:
        people = json.load(f)

    core_lookup = build_core_lookup(people)

    entries: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()
    matched_count = 0

    pages = bb_raw.get("pages", {})
    sorted_page_keys = sorted(pages.keys(), key=lambda x: int(x) if x.isdigit() else 999)

    for page_key in sorted_page_keys:
        page_data = pages[page_key]
        page_num = page_data.get("page_number", int(page_key) if page_key.isdigit() else 1)
        raw_section = page_data.get("alphabetical_section", "")
        
        # Normalize section
        section = raw_section.strip().upper()
        if not section or section == "MIXED":
            section = "Misc"

        for idx, contact in enumerate(page_data.get("contacts", [])):
            raw_full_name = contact.get("name", {}).get("full_name", "").strip()
            if not raw_full_name:
                continue

            cleaned_name = clean_name(raw_full_name)
            if not cleaned_name:
                continue

            entry_id = contact.get("entry_id") or f"bb-{page_num:03d}-{idx:02d}"
            if entry_id in seen_ids:
                entry_id = f"{entry_id}-{idx}"
            seen_ids.add(entry_id)

            # Extract phones
            phones: List[Dict[str, str]] = []
            for ph in contact.get("phones", []):
                num = ph.get("formatting") or ph.get("number")
                if num:
                    phones.append({
                        "number": num,
                        "type": ph.get("type", "phone"),
                    })

            # Extract emails
            emails = [em.get("address") for em in contact.get("emails", []) if em.get("address")]

            # Extract addresses
            addresses: List[str] = []
            for addr in contact.get("addresses", []):
                formatted = addr.get("formatted_address")
                if formatted:
                    addresses.append(formatted)
                else:
                    parts = [addr.get(k) for k in ["street", "city", "state", "country"] if addr.get(k)]
                    if parts:
                        addresses.append(", ".join(parts))

            # Extract handwritten notes
            notes: List[str] = []
            for n in contact.get("handwritten_notes", []):
                if isinstance(n, str) and n.strip():
                    notes.append(n.strip())
                elif isinstance(n, dict) and n.get("text"):
                    notes.append(n["text"].strip())
            if contact.get("formatting_notes"):
                notes.append(str(contact["formatting_notes"]).strip())

            # Match against core dossiers
            matched = match_core_profile(cleaned_name, core_lookup)
            matched_id = matched["id"] if matched else None
            matched_name = matched["name"] if matched else None

            if matched_id:
                matched_count += 1

            category = categorize_entry(cleaned_name, notes, section)

            # Determine primary alphabetical letter
            first_letter = cleaned_name[0].upper() if cleaned_name[0].isalpha() else "#"

            entries.append({
                "id": entry_id,
                "name": cleaned_name,
                "raw_name": raw_full_name,
                "page_number": page_num,
                "alphabetical_section": section,
                "first_letter": first_letter,
                "category": category,
                "phones": phones,
                "emails": emails,
                "addresses": addresses,
                "notes": notes,
                "matched_person_id": matched_id,
                "matched_person_name": matched_name,
                "has_core_dossier": matched_id is not None,
            })

    output_payload = {
        "metadata": {
            "source": "Epstein's Address Book (The 'Little Black Book')",
            "total_entries": len(entries),
            "total_pages": len(sorted_page_keys),
            "matched_core_figures": matched_count,
        },
        "entries": entries,
    }

    OUTPUT_BB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_BB_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)

    WEB_BB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(WEB_BB_PATH, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {OUTPUT_BB_PATH} & {WEB_BB_PATH}")
    print(f"Total entries: {len(entries)}")
    print(f"Matched core dossier figures: {matched_count}")


if __name__ == "__main__":
    run()
