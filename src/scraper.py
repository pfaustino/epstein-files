"""
Scraper and DOM parser for 'List of people named in the Epstein files' from Wikipedia.
Parses the cached HTML page in data/raw/wikipedia_page.html (or downloads if missing),
extracting structured raw records for all 157 named individuals.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup, Comment

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

RAW_DIR = Path("data/raw")
HTML_FILE = RAW_DIR / "wikipedia_page.html"
OUTPUT_FILE = RAW_DIR / "parsed_people_raw.json"

PAGE_URL = "https://en.wikipedia.org/wiki/List_of_people_named_in_the_Epstein_files"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def ensure_html_source() -> str:
    """Read cached HTML file or download it if absent."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if HTML_FILE.exists() and HTML_FILE.stat().st_size > 100_000:
        print(f"Reading cached HTML from {HTML_FILE} ({HTML_FILE.stat().st_size:,} bytes)...")
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


def clean_name_text(raw_text: str) -> str:
    """Clean person name from brackets, anchor markup, or extra whitespace."""
    text = re.sub(r"\[.*?\]", "", raw_text)
    text = text.split("<")[0].strip()
    return " ".join(text.split())


def get_full_res_image_url(thumb_url: str) -> str:
    """Derive full resolution Wikimedia Commons image URL from thumbnail URL."""
    # Example: //thumb.wikimedia.org/.../commons/thumb/5/53/Woody_Allen.jpg/250px-Woody_Allen.jpg
    # Becomes: https://upload.wikimedia.org/wikipedia/commons/5/53/Woody_Allen.jpg
    url = thumb_url
    if url.startswith("//"):
        url = "https:" + url

    # Strip thumbnail sizing
    if "/commons/thumb/" in url:
        # Match pattern: /commons/thumb/(a/b/filename.ext)/...
        match = re.search(r"/commons/thumb/([a-f0-9]/[a-f0-9]{2}/[^/]+)", url)
        if match:
            return f"https://upload.wikimedia.org/wikipedia/commons/{match.group(1)}"

    return url


def clean_paragraph_text(p_elem) -> str:
    """Extract text from a <p> or caption element preserving spaces around inline tags,
    removing citations [123], and normalizing whitespace and punctuation."""
    p_copy = BeautifulSoup(str(p_elem), "html.parser")
    for sup in p_copy.find_all(["sup", "sub"]):
        sup.decompose()
    text = p_copy.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text)
    # Remove space before punctuation marks: , . ; : ! ? %
    text = re.sub(r"\s+([,.;:!?%])", r"\1", text)
    # Clean inner bracket/parenthesis spacing
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    text = re.sub(r"\[\s+", "[", text)
    text = re.sub(r"\s+\]", "]", text)
    # Contractions / possessives: Epstein 's -> Epstein's
    text = re.sub(r"\b\s+'(s|t|re|ve|m|ll|d)\b", r"'\1", text, flags=re.IGNORECASE)
    # Quotes: remove space after opening quote and before closing quote if followed by space or punctuation
    text = re.sub(r'(?<=\s)"\s+([A-Za-z0-9])', r'"\1', text)
    text = re.sub(r'([A-Za-z0-9.,;!?])\s+"(?=\s|[.,;!?]|$)', r'\1"', text)
    # Currency symbols: $ 1.7 -> $1.7
    text = re.sub(r"([$£€])\s+(\d)", r"\1\2", text)
    return text.strip()


def extract_person_wiki_url(paragraphs: List[Any], person_name: str) -> Optional[str]:
    """Identify the standalone Wikipedia article URL for the person."""
    name_parts = person_name.lower().split()
    last_name = name_parts[-1] if name_parts else ""

    # Priority 1: Link in the paragraphs where link text matches full name
    for p in paragraphs:
        for a in p.find_all("a", href=True):
            href = a["href"]
            if "/wiki/" not in href:
                continue
            if any(prefix in href for prefix in [
                "/wiki/File:", "/wiki/Help:", "/wiki/Wikipedia:", "/wiki/Special:", "/wiki/Category:", "/wiki/Template:"
            ]):
                continue
            link_text = a.get_text(separator=" ", strip=True).lower()
            if link_text == person_name.lower():
                return href if href.startswith("http") else f"https://en.wikipedia.org{href}"

    # Priority 2: Link where text or slug contains last name
    for p in paragraphs:
        for a in p.find_all("a", href=True):
            href = a["href"]
            if "/wiki/" not in href:
                continue
            if any(prefix in href for prefix in [
                "/wiki/File:", "/wiki/Help:", "/wiki/Wikipedia:", "/wiki/Special:", "/wiki/Category:"
            ]):
                continue
            link_text = a.get_text(separator=" ", strip=True).lower()
            slug = href.split("/wiki/")[-1].lower()
            if last_name and (last_name in link_text or last_name in slug):
                return href if href.startswith("http") else f"https://en.wikipedia.org{href}"

    return None


def parse_html_to_records(html: str) -> List[Dict[str, Any]]:
    """Parse each person section into a structured dictionary."""
    soup = BeautifulSoup(html, "html.parser")

    # In Vector 2022 / Parsoid, each entry is a <section> containing a direct child div.mw-heading3
    person_secs = []
    for sec in soup.find_all("section"):
        heading3 = sec.find(lambda el: el.name == "div" and "mw-heading3" in el.get("class", []), recursive=False)
        if heading3:
            person_secs.append(sec)

    print(f"Found {len(person_secs)} individual person sections.")

    records: List[Dict[str, Any]] = []

    for sec in person_secs:
        h3 = sec.find("h3")
        raw_name = h3.get_text(strip=True) if h3 else ""
        name = clean_name_text(raw_name)

        # Determine anchor
        anchor_span = sec.find("span", class_="anchor")
        anchor_id = anchor_span.get("id") if anchor_span else (h3.get("id") if h3 else None)
        if not anchor_id:
            anchor_id = sec.get("aria-labelledby") or name.replace(" ", "_")

        # Category tag from comment
        category_tag = None
        for c in sec.find_all(string=lambda t: isinstance(t, Comment)):
            c_text = c.strip().lower()
            if c_text in ["celebrity", "academic", "politician", "business executive"]:
                category_tag = c_text
                break

        # Image thumbnail & high-res
        image_thumb = None
        image_full = None
        image_caption = None
        fig = sec.find("figure")
        if fig:
            img = fig.find("img")
            if img:
                raw_src = img.get("src", "")
                if raw_src.startswith("//"):
                    raw_src = "https:" + raw_src
                image_thumb = raw_src
                image_full = get_full_res_image_url(raw_src)

            cap = fig.find(["figcaption", "div"], class_=lambda c: c and "caption" in c)
            if cap:
                image_caption = clean_paragraph_text(cap)

        # Paragraphs
        p_tags = sec.find_all("p")
        paragraphs = [clean_paragraph_text(p) for p in p_tags if clean_paragraph_text(p)]

        # Links
        links = []
        for p in p_tags:
            for a in p.find_all("a", href=True):
                href = a["href"]
                link_text = a.get_text(separator=" ", strip=True)
                if re.match(r"^\[\d+\]$", link_text):
                    continue

                link_type = "external_wiki"
                target = href
                if href.startswith("#"):
                    link_type = "in_page_anchor"
                    target = href.lstrip("#")
                elif href.startswith("/wiki/"):
                    target = href.replace("/wiki/", "")
                elif href.startswith("http"):
                    link_type = "web"

                links.append({
                    "text": link_text,
                    "href": href,
                    "target": target,
                    "type": link_type,
                })

        # Citations
        citations = []
        for p in p_tags:
            for sup in p.find_all("sup", class_="reference"):
                cite_a = sup.find("a")
                if cite_a:
                    citations.append({
                        "ref_id": cite_a.get("href", "").lstrip("#"),
                        "label": cite_a.get_text(strip=True),
                    })

        wiki_url = extract_person_wiki_url(p_tags, name)

        records.append({
            "id": anchor_id.lower().replace("_", "-"),
            "name": name,
            "anchor": anchor_id,
            "category_tag": category_tag,
            "wikipedia_url": wiki_url,
            "image_thumb": image_thumb,
            "image_full": image_full,
            "image_caption": image_caption,
            "paragraphs": paragraphs,
            "full_text": "\n\n".join(paragraphs),
            "links": links,
            "citations": citations,
        })

    return records


def run():
    html = ensure_html_source()
    records = parse_html_to_records(html)
    print(f"Extracted {len(records)} people records.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Successfully saved raw parsed records to {OUTPUT_FILE}")

    # Summary statistics
    with_img = sum(1 for r in records if r["image_thumb"])
    with_wiki = sum(1 for r in records if r["wikipedia_url"])
    with_cat = sum(1 for r in records if r["category_tag"])
    total_paras = sum(len(r["paragraphs"]) for r in records)
    total_links = sum(len(r["links"]) for r in records)
    total_cites = sum(len(r["citations"]) for r in records)

    print("\n--- Scrape Summary ---")
    print(f"Total individuals:    {len(records)}")
    print(f"With portrait photos: {with_img}")
    print(f"With Wikipedia pages: {with_wiki}")
    print(f"With category tag:    {with_cat}")
    print(f"Total paragraphs:     {total_paras}")
    print(f"Total cross-links:    {total_links}")
    print(f"Total citations:      {total_cites}")


if __name__ == "__main__":
    run()
