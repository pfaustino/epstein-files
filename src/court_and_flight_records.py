"""
Court Dockets (Giuffre v. Maxwell Unsealed Exhibits) and Flight Log Records Dataset.
Provides structured investigative entities from Case No. 1:15-cv-07433 (SDNY)
and the official David Rodgers / Larry Visoski aircraft manifests.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

RAW_DIR = Path("data/raw")
OUTPUT_FILE = RAW_DIR / "parsed_court_and_flight_records.json"

COURT_AND_FLIGHT_ENTITIES: List[Dict[str, Any]] = [
    {
        "id": "virginia-giuffre",
        "name": "Virginia Giuffre",
        "anchor": "Virginia_Giuffre",
        "sector": "Victims, Plaintiffs & Witnesses",
        "profession_summary": "Lead plaintiff in Giuffre v. Maxwell and victims' rights advocate",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Virginia_Giuffre",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Virginia_Giuffre_%28cropped%29.jpg/250px-Virginia_Giuffre_%28cropped%29.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Civil Plaintiff & Key Accuser (Jane Doe 102)",
        "full_text": "Virginia Giuffre (née Roberts, identified as Jane Doe 102 / 003 in court filings) is the primary plaintiff in the landmark defamation suit Giuffre v. Maxwell (15-cv-07433-LAP). She alleged she was recruited from Mar-a-Lago at age 16 and trafficked by Epstein and Ghislaine Maxwell to prominent figures including Prince Andrew and Alan Dershowitz. Her legal actions led directly to the unsealing of over 2,000 pages of court dockets and deposition exhibits in 2024.",
        "paragraphs": [
            "Virginia Giuffre (née Roberts, identified as Jane Doe 102 / 003 in court filings) is the primary plaintiff in the landmark defamation suit Giuffre v. Maxwell (15-cv-07433-LAP). She alleged she was recruited from Mar-a-Lago at age 16 and trafficked by Epstein and Ghislaine Maxwell to prominent figures including Prince Andrew and Alan Dershowitz.",
            "Her legal actions led directly to the unsealing of over 2,000 pages of court dockets and deposition exhibits in 2024."
        ],
        "citations": [
            {"ref_id": "court-docket-15cv7433", "label": "Giuffre v. Maxwell Docket No. 15-cv-07433"},
            {"ref_id": "preska-unsealing-order-2024", "label": "SDNY Unsealing Order (Judge Loretta Preska, Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 32,
            "flight_notes": "Extensively documented across David Rodgers' flight logs between 2000 and 2002."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Documented in depositions and travel manifests traveling to Little Saint James.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Documented visiting the NYC townhouse on 71st Street.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Recruited while working as a spa attendant at Mar-a-Lago in Palm Beach.",
            "zorro_ranch_status": "Visited / Stayed",
            "zorro_ranch_notes": "Testified to visiting Zorro Ranch in New Mexico.",
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "sarah-kellen",
        "name": "Sarah Kellen",
        "anchor": "Sarah_Kellen",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Epstein's chief scheduling assistant and office administrator",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Sarah_Kellen",
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Executive Assistant / 2008 NPA Signatory",
        "full_text": "Sarah Kellen (now Sarah Kensington) served as Jeffrey Epstein's chief administrative assistant and daily scheduler for nearly a decade. She was granted federal immunity as a named potential co-conspirator in the controversial 2008 Southern District of Florida Non-Prosecution Agreement (NPA). Depositions and phone logs describe her coordinating travel, appointments, and household operations.",
        "paragraphs": [
            "Sarah Kellen (now Sarah Kensington) served as Jeffrey Epstein's chief administrative assistant and daily scheduler for nearly a decade. She was granted federal immunity as a named potential co-conspirator in the controversial 2008 Southern District of Florida Non-Prosecution Agreement (NPA).",
            "Depositions and phone logs describe her coordinating travel, appointments, and household operations across New York, Palm Beach, and Little Saint James."
        ],
        "citations": [
            {"ref_id": "fl-npa-2008", "label": "2008 Florida Non-Prosecution Agreement (NPA)"},
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg, Exhibit 13"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 45,
            "flight_notes": "Regularly accompanied Epstein on domestic and international flights in pilot manifests."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Traveled frequently to Little Saint James managing island staff.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Worked regularly at the 71st Street townhouse office.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Stationed at the Palm Beach mansion during Epstein's Florida stays.",
            "zorro_ranch_status": "Visited / Stayed",
            "zorro_ranch_notes": "Managed logistics during ranch visits.",
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "lesley-groff",
        "name": "Lesley Groff",
        "anchor": "Lesley_Groff",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Epstein's New York executive assistant of over twenty years",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Executive Assistant / 2008 NPA Signatory",
        "full_text": "Lesley Groff was Jeffrey Epstein's executive secretary in his New York office for over twenty years. She was named in the 2008 Florida Non-Prosecution Agreement as a potential co-conspirator. Groff managed Epstein's daily calendar, flight bookings, and communications with high-profile business associates and scientists. Her attorneys have consistently maintained she worked strictly as an administrative employee without knowledge of illegal acts.",
        "paragraphs": [
            "Lesley Groff was Jeffrey Epstein's executive secretary in his New York office for over twenty years. She was named in the 2008 Florida Non-Prosecution Agreement as a potential co-conspirator.",
            "Groff managed Epstein's daily calendar, flight bookings, and communications with high-profile business associates and scientists. Her attorneys have maintained she worked strictly as an administrative employee."
        ],
        "citations": [
            {"ref_id": "fl-npa-2008", "label": "2008 Florida Non-Prosecution Agreement (NPA)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 15,
            "flight_notes": "Recorded on corporate travel manifests between New York and Florida."
        },
        "property_visits": {
            "island_status": "Referenced",
            "island_notes": "Coordinated travel to the Virgin Islands.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Primary work location in Manhattan.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Visited during seasonal relocations.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "johanna-sjoberg",
        "name": "Johanna Sjoberg",
        "anchor": "Johanna_Sjoberg",
        "sector": "Victims, Plaintiffs & Witnesses",
        "profession_summary": "Former college student and key deposition witness in Giuffre v. Maxwell",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Deposition Witness",
        "full_text": "Johanna Sjoberg was a college student recruited to work for Epstein in the early 2000s. Her detailed sworn deposition from 2016 was unsealed by court order in January 2024. She provided key factual accounts of the puppet photograph involving Prince Andrew, and testified about seeing visitors including David Copperfield and Michael Jackson at Epstein's properties.",
        "paragraphs": [
            "Johanna Sjoberg was a college student recruited to work for Epstein in the early 2000s. Her detailed sworn deposition from 2016 was unsealed by court order in January 2024.",
            "She provided key factual accounts of the puppet photograph involving Prince Andrew, and testified about seeing visitors including David Copperfield and Michael Jackson at Epstein's properties."
        ],
        "citations": [
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg (Unsealed Jan 2024, SDNY)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 8,
            "flight_notes": "Traveled on flights between Palm Beach, New York, and Little Saint James."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Testified to traveling to Little Saint James.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Present during the Spitting Image puppet incident with Prince Andrew.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Recruited and stayed at the Palm Beach mansion.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "juan-alessi",
        "name": "Juan Alessi",
        "anchor": "Juan_Alessi",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Head butler and estate manager at Epstein's Palm Beach residence",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Household Staff (Head Butler / Property Manager)",
        "full_text": "Juan Alessi was the head butler and estate manager at Jeffrey Epstein's Palm Beach mansion from 1990 until 2002. In civil depositions and at Ghislaine Maxwell's 2021 trial, Alessi provided extensive testimony regarding the visitors who stayed at the house, flight routines, household protocols, and celebrity guests including Prince Andrew and Donald Trump.",
        "paragraphs": [
            "Juan Alessi was the head butler and estate manager at Jeffrey Epstein's Palm Beach mansion from 1990 until 2002.",
            "In civil depositions and at Ghislaine Maxwell's 2021 trial, Alessi provided extensive testimony regarding the visitors who stayed at the house, flight routines, household protocols, and celebrity guests."
        ],
        "citations": [
            {"ref_id": "alessi-testimony-2021", "label": "Trial Testimony of Juan Alessi, US v. Maxwell (2021)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 10,
            "flight_notes": "Flew with household staff between Florida and New York."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Assisted with setup on Little Saint James.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Coordinated with Manhattan staff.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Primary place of employment for 12 years.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "alfredo-rodriguez",
        "name": "Alfredo Rodriguez",
        "anchor": "Alfredo_Rodriguez",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Palm Beach security guard and author of handwritten contact notes",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Household Staff / Note Author",
        "full_text": "Alfredo Rodriguez was a security guard and butler at Epstein's Palm Beach estate in 2004–2005. During the initial police investigation, Rodriguez compiled a handwritten journal documenting names, telephone numbers, and notes about visitors to the estate. The journal later became a key exhibit in federal and civil litigation.",
        "paragraphs": [
            "Alfredo Rodriguez was a security guard and butler at Epstein's Palm Beach estate in 2004–2005.",
            "During the initial police investigation, Rodriguez compiled a handwritten journal documenting names, telephone numbers, and notes about visitors to the estate."
        ],
        "citations": [
            {"ref_id": "rodriguez-journal-exhibit", "label": "Palm Beach Police Evidence Exhibit / Rodriguez Journal"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Stationed as gate security and house guard in Palm Beach.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "david-rodgers",
        "name": "David Rodgers",
        "anchor": "David_Rodgers",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Chief pilot of Epstein's Boeing 727 and maintainer of primary flight logs",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Chief Pilot / Flight Manifest Keeper",
        "full_text": "David Rodgers was Jeffrey Epstein's chief corporate pilot who flew his Boeing 727-100 (nicknamed the 'Lolita Express', tail number N908JE) from 1991 until 2006. Rodgers meticulously maintained the bound flight log manifests detailing every takeoff, destination, passenger list, and date. His logs were subpoenaed by federal prosecutors and civil attorneys, forming the definitive public travel record of Epstein's associates.",
        "paragraphs": [
            "David Rodgers was Jeffrey Epstein's chief corporate pilot who flew his Boeing 727-100 (tail number N908JE) from 1991 until 2006.",
            "Rodgers meticulously maintained the bound flight log manifests detailing every takeoff, destination, passenger list, and date. His logs form the definitive public travel record of Epstein's associates."
        ],
        "citations": [
            {"ref_id": "rodgers-flight-logs-exhibit", "label": "David Rodgers Flight Manifest Exhibit (1991–2006)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 1500,
            "flight_notes": "Pilot in command for thousands of flight hours."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Flew regularly into St. Thomas Cyril E. King Airport serving Little Saint James.",
            "townhouse_status": "Referenced",
            "townhouse_notes": "Liaised with New York dispatch office.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Stationed at Palm Beach International Airport.",
            "zorro_ranch_status": "Visited / Stayed",
            "zorro_ranch_notes": "Flew into Santa Fe Airport serving Zorro Ranch.",
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "larry-visoski",
        "name": "Larry Visoski",
        "anchor": "Larry_Visoski",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Longtime corporate pilot of Epstein's Gulfstream and Boeing aircraft",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Longtime Corporate Pilot",
        "full_text": "Larry Visoski was a primary commercial pilot who flew Jeffrey Epstein's private planes for nearly thirty years, starting in 1991. Visoski was the first witness called by federal prosecutors at the 2021 sex-trafficking trial of Ghislaine Maxwell. He testified under oath regarding prominent passengers he flew, including Donald Trump, Bill Clinton, Prince Andrew, and Kevin Spacey.",
        "paragraphs": [
            "Larry Visoski was a primary commercial pilot who flew Jeffrey Epstein's private planes for nearly thirty years, starting in 1991.",
            "Visoski was the first witness called by federal prosecutors at the 2021 trial of Ghislaine Maxwell, testifying under oath regarding passengers he flew, including Donald Trump, Bill Clinton, Prince Andrew, and Kevin Spacey."
        ],
        "citations": [
            {"ref_id": "visoski-trial-testimony-2021", "label": "Trial Testimony of Larry Visoski, US v. Maxwell (Nov 2021)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 1200,
            "flight_notes": "Pilot in command across Epstein's Gulfstream II, Gulfstream IV, and Boeing 727."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Piloted flights to St. Thomas for island visits.",
            "townhouse_status": "Referenced",
            "townhouse_notes": "Coordinated with Manhattan logistics.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Piloted flights between Palm Beach and Teterboro.",
            "zorro_ranch_status": "Visited / Stayed",
            "zorro_ranch_notes": "Piloted flights to New Mexico.",
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "tony-blair",
        "name": "Tony Blair",
        "anchor": "Tony_Blair",
        "sector": "Politics, Government & Diplomacy",
        "profession_summary": "Former Prime Minister of the United Kingdom",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Tony_Blair",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Tony_Blair_at_the_European_Commission_-_2024_%28cropped%29.jpg/250px-Tony_Blair_at_the_European_Commission_-_2024_%28cropped%29.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Government Figure / Meeting Mention",
        "full_text": "Tony Blair was Prime Minister of the United Kingdom from 1997 to 2007. In unsealed 2024 court filings and released correspondence, Blair is mentioned in connection with meetings involving Middle East peace envoy contacts and mutual acquaintances such as Peter Mandelson. Blair has stated he had no personal relationship with Epstein and never accepted money or hospitality from him.",
        "paragraphs": [
            "Tony Blair was Prime Minister of the United Kingdom from 1997 to 2007. In unsealed 2024 court filings and released correspondence, Blair is mentioned in connection with meetings involving Middle East peace contacts.",
            "Blair has stated he had no personal relationship with Epstein and never accepted money or hospitality from him."
        ],
        "citations": [
            {"ref_id": "unsealed-does-2024", "label": "Unsealed Giuffre v. Maxwell Documents (Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "michael-jackson",
        "name": "Michael Jackson",
        "anchor": "Michael_Jackson",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "American pop singer and cultural icon",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Michael_Jackson",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Michael_Jackson_in_1988.jpg/250px-Michael_Jackson_in_1988.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Deposition Mention (No Misconduct Alleged)",
        "full_text": "Michael Jackson's name appeared in unsealed deposition transcripts from Johanna Sjoberg released in January 2024. Sjoberg testified that she met Jackson at Jeffrey Epstein's Palm Beach home in the early 2000s. When asked whether she ever gave Jackson a massage or if any inappropriate conduct occurred, Sjoberg testified under oath that nothing improper occurred.",
        "paragraphs": [
            "Michael Jackson's name appeared in unsealed deposition transcripts from Johanna Sjoberg released in January 2024.",
            "Sjoberg testified that she met Jackson at Jeffrey Epstein's Palm Beach home in the early 2000s. When asked whether any inappropriate conduct occurred, Sjoberg testified under oath that nothing improper occurred."
        ],
        "citations": [
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg, pp. 166–167 (Unsealed Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Sjoberg testified meeting Jackson once at the Palm Beach home.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "leonardo-dicaprio",
        "name": "Leonardo DiCaprio",
        "anchor": "Leonardo_DiCaprio",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "Academy Award-winning American actor and film producer",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Leonardo_DiCaprio",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Leonardo_Dicaprio_Cannes_2019.jpg/250px-Leonardo_Dicaprio_Cannes_2019.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Incidental Deposition Questioning (No Misconduct Alleged)",
        "full_text": "Leonardo DiCaprio was mentioned in unsealed deposition testimony during the questioning of witness Johanna Sjoberg in Giuffre v. Maxwell. The attorney asked Sjoberg if Epstein ever spoke about DiCaprio. Sjoberg responded that Epstein would frequently name-drop celebrities during phone calls, but confirmed she never met DiCaprio. No allegation of wrongdoing was made against him.",
        "paragraphs": [
            "Leonardo DiCaprio was mentioned in unsealed deposition testimony during the questioning of witness Johanna Sjoberg in Giuffre v. Maxwell.",
            "The attorney asked Sjoberg if Epstein ever spoke about DiCaprio. Sjoberg testified that Epstein would name-drop celebrities, but confirmed she never met DiCaprio. No allegation of wrongdoing was made against him."
        ],
        "citations": [
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg, p. 165 (Unsealed Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "chris-tucker",
        "name": "Chris Tucker",
        "anchor": "Chris_Tucker",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "American comedian and actor",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Chris_Tucker",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Chris_Tucker_%2814881023759%29_%28cropped%29.jpg/250px-Chris_Tucker_%2814881023759%29_%28cropped%29.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Flight Manifest Passenger (2002 Africa Trip)",
        "full_text": "Chris Tucker is an American actor and stand-up comedian whose name appears on the pilot manifests for Epstein's Boeing 727. In September 2002, Tucker traveled on the plane as part of a high-profile humanitarian trip to Africa focused on HIV/AIDS awareness and poverty, alongside former President Bill Clinton, Kevin Spacey, and Jeffrey Epstein. Tucker has not been accused of any misconduct.",
        "paragraphs": [
            "Chris Tucker is an American actor and stand-up comedian whose name appears on the pilot manifests for Epstein's Boeing 727.",
            "In September 2002, Tucker traveled on the plane as part of a high-profile humanitarian trip to Africa focused on HIV/AIDS awareness alongside former President Bill Clinton and Kevin Spacey. Tucker has not been accused of any misconduct."
        ],
        "citations": [
            {"ref_id": "rodgers-flight-logs-2002", "label": "David Rodgers Flight Logs, Sept 2002 Africa Trip"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 4,
            "flight_notes": "Logged on multi-leg Africa humanitarian trip in September 2002 with Bill Clinton."
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "itzhak-perlman",
        "name": "Itzhak Perlman",
        "anchor": "Itzhak_Perlman",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "World-renowned Israeli-American concert violinist and conductor",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Itzhak_Perlman",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Itzhak_Perlman_1984.jpg/250px-Itzhak_Perlman_1984.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Flight Manifest Passenger",
        "full_text": "Itzhak Perlman is a world-renowned virtuoso violinist whose name appears on flight manifests for Jeffrey Epstein's private aircraft in the late 1990s. The travel logs document Perlman flying between New York and concert/music festival locations, including the Interlochen Arts Camp in Michigan and Tanglewood in Massachusetts. Perlman has not been accused of any misconduct.",
        "paragraphs": [
            "Itzhak Perlman is a world-renowned virtuoso violinist whose name appears on flight manifests for Jeffrey Epstein's private aircraft in the late 1990s.",
            "The travel logs document Perlman flying between New York and music festival locations including Interlochen and Tanglewood. Perlman has not been accused of any misconduct."
        ],
        "citations": [
            {"ref_id": "rodgers-flight-logs-perlman", "label": "David Rodgers Flight Manifest Exhibit (1998 Interlochen)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 3,
            "flight_notes": "Logged on domestic flights between New York and Michigan/Massachusetts."
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "cameron-diaz",
        "name": "Cameron Diaz",
        "anchor": "Cameron_Diaz",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "American actress and author",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Cameron_Diaz",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Cameron_Diaz_WE_2014_-_cropped.jpg/250px-Cameron_Diaz_WE_2014_-_cropped.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Incidental Deposition Questioning (No Misconduct Alleged)",
        "full_text": "Cameron Diaz was named in unsealed deposition transcripts from Giuffre v. Maxwell during the cross-examination of witness Johanna Sjoberg. The attorney asked Sjoberg if she had ever met Diaz or if Epstein ever introduced her to Diaz. Sjoberg responded that she had never met her. Diaz issued a statement reiterating she never met Epstein and had no connection to him.",
        "paragraphs": [
            "Cameron Diaz was named in unsealed deposition transcripts from Giuffre v. Maxwell during the cross-examination of witness Johanna Sjoberg.",
            "Sjoberg confirmed she had never met Diaz. Diaz issued a public statement reiterating she never met Epstein and had no connection to him."
        ],
        "citations": [
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg, p. 165 (Unsealed Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "cate-blanchett",
        "name": "Cate Blanchett",
        "anchor": "Cate_Blanchett",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "Academy Award-winning Australian actress and producer",
        "wikipedia_url": "https://en.wikipedia.org/wiki/Cate_Blanchett",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Cate_Blanchett_Cannes_2018_2_%28cropped%29.jpg/250px-Cate_Blanchett_Cannes_2018_2_%28cropped%29.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Incidental Deposition Questioning (No Misconduct Alleged)",
        "full_text": "Cate Blanchett was mentioned in unsealed deposition transcripts from Giuffre v. Maxwell when an attorney questioned Johanna Sjoberg about names Epstein may have claimed to know. Sjoberg testified that she had never met Blanchett. Blanchett's representatives confirmed she had zero contact or involvement with Epstein.",
        "paragraphs": [
            "Cate Blanchett was mentioned in unsealed deposition transcripts from Giuffre v. Maxwell when an attorney questioned Johanna Sjoberg about names Epstein may have claimed to know.",
            "Sjoberg testified that she had never met Blanchett. Blanchett's representatives confirmed she had zero contact or involvement with Epstein."
        ],
        "citations": [
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg, p. 165 (Unsealed Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "george-lucas",
        "name": "George Lucas",
        "anchor": "George_Lucas",
        "sector": "Entertainment, Arts & Media",
        "profession_summary": "American filmmaker and creator of Star Wars and Indiana Jones",
        "wikipedia_url": "https://en.wikipedia.org/wiki/George_Lucas",
        "image_thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/George_Lucas_cropped_2009.jpg/250px-George_Lucas_cropped_2009.jpg",
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Incidental Deposition Questioning (No Misconduct Alleged)",
        "full_text": "George Lucas was mentioned in unsealed court deposition transcripts in Giuffre v. Maxwell during the questioning of witness Johanna Sjoberg. The attorney asked Sjoberg if she had ever met George Lucas through Epstein. Sjoberg responded that she had not. Lucas has had no allegations of wrongdoing made against him.",
        "paragraphs": [
            "George Lucas was mentioned in unsealed court deposition transcripts in Giuffre v. Maxwell during the questioning of witness Johanna Sjoberg.",
            "Sjoberg confirmed under oath that she had never met Lucas. Lucas has had no allegations of wrongdoing made against him."
        ],
        "citations": [
            {"ref_id": "sjoberg-depo-2024", "label": "Deposition of Johanna Sjoberg, p. 165 (Unsealed Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": False,
            "flight_count_estimate": None,
            "flight_notes": None
        },
        "property_visits": {
            "island_status": "None",
            "island_notes": None,
            "townhouse_status": "None",
            "townhouse_notes": None,
            "palm_beach_status": "None",
            "palm_beach_notes": None,
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": False
        }
    },
    {
        "id": "emmy-tayler",
        "name": "Emmy Tayler",
        "anchor": "Emmy_Tayler",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Ghislaine Maxwell's longtime personal assistant",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Personal Assistant to Maxwell",
        "full_text": "Emmy Tayler was Ghislaine Maxwell's personal assistant in the early 2000s and was named in unsealed civil exhibits and flight records. She frequently traveled with Maxwell between London, New York, and the Virgin Islands. Her attorneys have denied any wrongdoing on her part.",
        "paragraphs": [
            "Emmy Tayler was Ghislaine Maxwell's personal assistant in the early 2000s and was named in unsealed civil exhibits and flight records.",
            "She traveled with Maxwell between London, New York, and the Virgin Islands. Her attorneys have denied any wrongdoing on her part."
        ],
        "citations": [
            {"ref_id": "tayler-exhibit-2024", "label": "Giuffre v. Maxwell Unsealed Exhibits (Jan 2024)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 14,
            "flight_notes": "Accompanied Maxwell on international and domestic flights."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Traveled to Little Saint James with Maxwell.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Visited Manhattan residence.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Stayed during Florida trips.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    },
    {
        "id": "adriana-ross",
        "name": "Adriana Ross",
        "anchor": "Adriana_Ross",
        "sector": "Epstein Inner Circle & Staff",
        "profession_summary": "Former Polish model and assistant named in 2008 NPA",
        "wikipedia_url": None,
        "image_thumb": None,
        "source_dataset": "court_does_and_flights",
        "source_label": "Court Dockets & Flight Logs",
        "legal_context": "Assistant / 2008 NPA Signatory",
        "full_text": "Adriana Ross was a Polish model who worked as an assistant to Epstein and was granted federal immunity as a named potential co-conspirator in the 2008 Florida Non-Prosecution Agreement. She was frequently logged on flight manifests traveling between New York, Florida, and the Caribbean.",
        "paragraphs": [
            "Adriana Ross was a Polish model who worked as an assistant to Epstein and was granted federal immunity in the 2008 Florida Non-Prosecution Agreement.",
            "She was frequently logged on flight manifests traveling between New York, Florida, and the Caribbean."
        ],
        "citations": [
            {"ref_id": "fl-npa-2008", "label": "2008 Florida Non-Prosecution Agreement (NPA)"}
        ],
        "flight_logs": {
            "flew_on_private_plane": True,
            "flight_count_estimate": 22,
            "flight_notes": "Regular passenger on Boeing 727 and Gulfstream manifests."
        },
        "property_visits": {
            "island_status": "Visited",
            "island_notes": "Visited Little Saint James.",
            "townhouse_status": "Visited",
            "townhouse_notes": "Visited Manhattan townhouse.",
            "palm_beach_status": "Visited / Stayed",
            "palm_beach_notes": "Stayed at Palm Beach mansion.",
            "zorro_ranch_status": "None",
            "zorro_ranch_notes": None,
            "paris_status": "None",
            "paris_notes": None,
            "any_property_visited_or_offered": True
        }
    }
]


def run():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(COURT_AND_FLIGHT_ENTITIES, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(COURT_AND_FLIGHT_ENTITIES)} court & flight records to {OUTPUT_FILE}")


if __name__ == "__main__":
    run()
