"""
Scraper and DOM parser for 'Connections of Jeffrey Epstein' from Wikipedia.
Parses the cached HTML page in data/raw/wikipedia_connections.html (or downloads if missing),
extracting additional named individuals and key institutions that complement the main Files list.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

RAW_DIR = Path("data/raw")
HTML_FILE = RAW_DIR / "wikipedia_connections.html"
OUTPUT_FILE = RAW_DIR / "parsed_connections_raw.json"

PAGE_URL = "https://en.wikipedia.org/wiki/Connections_of_Jeffrey_Epstein"
USER_AGENT = "EpsteinResearchBot/1.0 (https://github.com/epstein-files; contact@example.com)"


def ensure_html_source() -> str:
    """Read cached HTML file or download it if absent."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if HTML_FILE.exists() and HTML_FILE.stat().st_size > 50_000:
        print(f"Reading cached Connections HTML from {HTML_FILE} ({HTML_FILE.stat().st_size:,} bytes)...")
        return HTML_FILE.read_text(encoding="utf-8")

    print(f"Downloading HTML from {PAGE_URL}...")
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    response = httpx.get(PAGE_URL, headers=headers, follow_redirects=True, timeout=60.0)
    response.raise_for_status()
    html = response.text
    HTML_FILE.write_text(html, encoding="utf-8")
    print(f"Saved {len(html):,} bytes to {HTML_FILE}")
    return html


def clean_paragraph_text(p_elem) -> str:
    """Extract text from a <p> element preserving spaces around inline tags,
    removing citations [123], and normalizing whitespace and punctuation."""
    p_copy = BeautifulSoup(str(p_elem), "html.parser")
    for sup in p_copy.find_all(["sup", "sub"]):
        sup.decompose()
    text = p_copy.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.;:!?%])", r"\1", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    text = re.sub(r"\[\s+", "[", text)
    text = re.sub(r"\s+\]", "]", text)
    text = re.sub(r"\b\s+'(s|t|re|ve|m|ll|d)\b", r"'\1", text, flags=re.IGNORECASE)
    text = re.sub(r'(?<=\s)"\s+([A-Za-z0-9])', r'"\1', text)
    text = re.sub(r'([A-Za-z0-9.,;!?])\s+"(?=\s|[.,;!?]|$)', r'\1"', text)
    text = re.sub(r"([$£€])\s+(\d)", r"\1\2", text)
    return text.strip()


# Additional figures found in Connections article not present in List_of_people_named_in_the_Epstein_files
ADDITIONAL_PEOPLE = [
    {
        "name": "John Casablancas",
        "anchor": "John_Casablancas",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "Founder of Elite Model Management",
        "wikipedia_url": "https://en.wikipedia.org/wiki/John_Casablancas",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/John_Casablancas_in_1990.jpg/250px-John_Casablancas_in_1990.jpg",
        "legal_context": "Documented Modeling Agency Connection",
    },
    {
        "name": "Murray Gell-Mann",
        "anchor": "Murray_Gell-Mann",
        "sector": "Academia, Science & Research",
        "profession_summary": "Nobel laureate theoretical physicist",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Murray_Gell-Mann",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Murray_Gell-Mann_in_2007.jpg/250px-Murray_Gell-Mann_in_2007.jpg",
        "legal_context": "Financial / Grant Recipient",
    },
    {
        "name": "Juleanna Glover",
        "anchor": "Juleanna_Glover",
        "sector": "Politics, Government & Diplomacy",
        "profession_summary": "Corporate public affairs consultant and political strategist",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Juleanna_Glover",
        "image_thumb": None,
        "legal_context": "Public Affairs / Social Connection",
    },
    {
        "name": "Faith Kates",
        "anchor": "Faith_Kates",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "Founder of Next Model Management",
        "wikipedia_url": None,
        "image_thumb": None,
        "legal_context": "Documented Modeling Agency Connection",
    },
    {
        "name": "Mark Middleton",
        "anchor": "Mark_Middleton",
        "sector": "Politics, Government & Diplomacy",
        "profession_summary": "White House special assistant to President Bill Clinton",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Mark_Middleton_(businessman)",
        "image_thumb": None,
        "legal_context": "White House Visitor Logs / Intermediary",
    },
    {
        "name": "Richard Branson",
        "anchor": "Richard_Branson",
        "sector": "Finance, Business & Real Estate",
        "profession_summary": "British billionaire entrepreneur and co-founder of Virgin Group",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Richard_Branson",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Richard_Branson_March_2015.jpg/250px-Richard_Branson_March_2015.jpg",
        "legal_context": "Documented PR Advice / Black Book",
        "custom_paragraphs": [
            "Sir Richard Branson is a British billionaire entrepreneur and co-founder of the Virgin Group. In unsealed 2026 Department of Justice disclosures and court exhibits, email correspondence revealed that Epstein met with Branson and received public relations advice from him following Epstein's 2008 Florida conviction.",
            "In one email exchange regarding visits to their respective Caribbean islands, Branson invited Epstein to visit and wrote 'bring your harem'. Branson's contact details and multiple private telephone numbers were also recorded in Epstein's 95-page address book ('The Black Book', page 7).",
            "A spokesperson for Branson stated that the 'harem' phrase was intended facetiously, that Branson had only met Epstein on a few occasions in public and social settings, and that he had severed contact after learning the full extent of Epstein's crimes.",
        ],
    },
]

# Key institutions profiled in Connections article
ADDITIONAL_INSTITUTIONS = [
    {
        "name": "JP Morgan Chase Bank",
        "anchor": "JP_Morgan_Chase_Bank",
        "sector": "Finance, Business & Real Estate",
        "profession_summary": "Major Wall Street financial institution (banked Epstein 1998–2013)",
        "wikipedia_url": "https://en.wikipedia.org/wiki/JPMorgan_Chase",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/JPMorgan_Chase_Logo_2008.svg/250px-JPMorgan_Chase_Logo_2008.svg.png",
        "legal_context": "Key Associated Financial Institution",
    },
    {
        "name": "Deutsche Bank",
        "anchor": "Deutsche_Bank",
        "sector": "Finance, Business & Real Estate",
        "profession_summary": "German multinational investment bank (banked Epstein 2013–2018 post-conviction)",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Deutsche_Bank",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Deutsche_Bank_logo_without_wordmark.svg/250px-Deutsche_Bank_logo_without_wordmark.svg.png",
        "legal_context": "Key Associated Financial Institution",
    },
    {
        "name": "Valar Ventures & Carbyne",
        "anchor": "Valar_Ventures_&_Carbyne",
        "sector": "Tech, Crypto & Venture Capital",
        "profession_summary": "Venture capital fund (Peter Thiel) and emergency response tech firm (Ehud Barak)",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Carbyne_(company)",
        "image_thumb": None,
        "legal_context": "Investment & Venture Connection",
    },
    {
        "name": "Program for Evolutionary Dynamics",
        "anchor": "Program_for_Evolutionary_Dynamics",
        "sector": "Academia, Science & Research",
        "profession_summary": "Harvard University academic research center directed by Martin Nowak ($30M donation)",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Program_for_Evolutionary_Dynamics",
        "image_thumb": None,
        "legal_context": "Epstein-Funded Academic Center",
    },
    {
        "name": "Mount Sinai Hospital",
        "anchor": "Mount_Sinai_Hospital",
        "sector": "Healthcare & Medicine",
        "profession_summary": "New York medical center (recipient of over $250,000 post-conviction)",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Mount_Sinai_Hospital_(Manhattan)",
        "image_thumb": None,
        "legal_context": "Donation Recipient",
    },
    {
        "name": "Palm Beach Police Department",
        "anchor": "Palm_Beach_Police_Department",
        "sector": "Law, Law Enforcement & Legal Defense",
        "profession_summary": "Law enforcement agency conducting 2005–2006 investigation into Epstein",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Palm_Beach_Police_Department",
        "image_thumb": None,
        "legal_context": "Investigative Agency / Returned Donations",
    },
]


def parse_connections_records(html: str) -> List[Dict[str, Any]]:
    """Extract structured records for additional individuals and institutions."""
    soup = BeautifulSoup(html, "html.parser")
    records: List[Dict[str, Any]] = []

    # 1. Process People
    for person_meta in ADDITIONAL_PEOPLE:
        name = person_meta["name"]
        paras = []
        citations = []
        links = []

        if person_meta.get("custom_paragraphs"):
            paras = person_meta["custom_paragraphs"]
        else:
            h4 = soup.find(lambda el: el.name == "h4" and name in el.get_text())
            if h4:
                sec = h4.find_parent("section")
                if sec:
                    p_tags = sec.find_all("p")
                    paras = [clean_paragraph_text(p) for p in p_tags if clean_paragraph_text(p)]
                    for p in p_tags:
                        for sup in p.find_all("sup", class_="reference"):
                            cite_a = sup.find("a")
                            if cite_a:
                                citations.append({
                                    "ref_id": cite_a.get("href", "").lstrip("#"),
                                    "label": cite_a.get_text(strip=True),
                                })
                        for a in p.find_all("a", href=True):
                            href = a["href"]
                            lt = a.get_text(separator=" ", strip=True)
                            if not re.match(r"^\[\d+\]$", lt):
                                links.append({"text": lt, "href": href})

        full_text = "\n\n".join(paras) if paras else f"{name} is documented in Wikipedia's analysis of Jeffrey Epstein's network."
        records.append({
            "id": person_meta["anchor"].lower().replace("_", "-").replace("&", "and"),
            "name": name,
            "anchor": person_meta["anchor"],
            "category_tag": None,
            "sector": person_meta["sector"],
            "profession_summary": person_meta["profession_summary"],
            "wikipedia_url": person_meta["wikipedia_url"],
            "image_thumb": person_meta["image_thumb"],
            "image_full": person_meta["image_thumb"],
            "image_caption": None,
            "paragraphs": paras,
            "full_text": full_text,
            "links": links,
            "citations": citations,
            "citations_count": len(citations),
            "source_dataset": "connections_article",
            "source_label": "Wikipedia: Connections",
            "legal_context": person_meta["legal_context"],
        })

    # 2. Process Key Institutions
    for inst_meta in ADDITIONAL_INSTITUTIONS:
        name = inst_meta["name"]
        h4 = soup.find(lambda el: el.name == "h4" and any(k.lower() in el.get_text().lower() for k in name.split()[:2]))
        paras = []
        citations = []
        links = []
        if h4:
            sec = h4.find_parent("section")
            if sec:
                p_tags = sec.find_all("p")
                paras = [clean_paragraph_text(p) for p in p_tags if clean_paragraph_text(p)]
                for p in p_tags:
                    for sup in p.find_all("sup", class_="reference"):
                        cite_a = sup.find("a")
                        if cite_a:
                            citations.append({
                                "ref_id": cite_a.get("href", "").lstrip("#"),
                                "label": cite_a.get_text(strip=True),
                            })
                    for a in p.find_all("a", href=True):
                        href = a["href"]
                        lt = a.get_text(separator=" ", strip=True)
                        if not re.match(r"^\[\d+\]$", lt):
                            links.append({"text": lt, "href": href})

        full_text = "\n\n".join(paras) if paras else f"{name} is an institution documented in connection with Jeffrey Epstein."
        records.append({
            "id": inst_meta["anchor"].lower().replace("_", "-").replace("&", "and"),
            "name": name,
            "anchor": inst_meta["anchor"],
            "category_tag": None,
            "sector": inst_meta["sector"],
            "profession_summary": inst_meta["profession_summary"],
            "wikipedia_url": inst_meta["wikipedia_url"],
            "image_thumb": inst_meta["image_thumb"],
            "image_full": inst_meta["image_thumb"],
            "image_caption": None,
            "paragraphs": paras,
            "full_text": full_text,
            "links": links,
            "citations": citations,
            "citations_count": len(citations),
            "source_dataset": "connections_article",
            "source_label": "Wikipedia: Connections & Orgs",
            "legal_context": inst_meta["legal_context"],
        })

    return records


def run():
    html = ensure_html_source()
    records = parse_connections_records(html)
    print(f"Extracted {len(records)} records from Connections article.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Saved parsed connections records to {OUTPUT_FILE}")


if __name__ == "__main__":
    run()
