#!/usr/bin/env python3
"""Build a clean, de-duplicated publication list from data/openalex_works_filtered.json.

Excludes zero-citation duplicate/abstract entries that don't correspond to a
distinct published paper (identified by manual cross-check against
https://emmatimminsschiffman.weebly.com/publications.html on 2026-07-21).

Usage:
    python3 build_publications_list.py [data_dir]

Writes data/publications_clean.json.
"""
import json
import sys
from pathlib import Path

# Titles confirmed as duplicates/abstracts not present on the Weebly publications page.
EXCLUDE_TITLES = {
    "Achieving high confidence protein annotations in a sea of unknowns",
    "Physiological Diagnosis of a Southern Ocean Diatom's Responses to Future Complex Ocean Conditions",
    "The peptide equivalent of the 16SrRNA assay: Revealing Phylogeny and Function",
    "Proteomic Assessment of Polar Bacteria Phylogeny and Functional Shifts During POM Degradation at 0°C",
}

AUTHOR_SELF_NAMES = {"emma timmins-schiffman", "emma timmins‐schiffman"}


def clean_work(w: dict) -> dict:
    venue = None
    loc = w.get("primary_location") or {}
    source = loc.get("source") or {}
    venue = source.get("display_name")

    # Keep the full author list in its original (byline) order, including
    # Emma herself, so her position among co-authors is preserved.
    authors = [a["author"]["display_name"] for a in w.get("authorships", []) if a.get("author")]
    self_index = next((i for i, a in enumerate(authors) if a.strip().lower() in AUTHOR_SELF_NAMES), None)

    return {
        "title": w.get("display_name"),
        "year": w.get("publication_year"),
        "venue": venue,
        "type": w.get("type"),
        "authors": authors,
        "self_author_index": self_index,
        "cited_by_count": w.get("cited_by_count"),
        "counts_by_year": w.get("counts_by_year", []),
        "doi": w.get("doi"),
        "openalex_id": w.get("id"),
    }


def main():
    data_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "data"
    works = json.loads((data_dir / "openalex_works_filtered.json").read_text())

    kept = [w for w in works if w.get("display_name") not in EXCLUDE_TITLES]
    cleaned = [clean_work(w) for w in kept]
    cleaned.sort(key=lambda p: (p["year"] is None, -(p["year"] or 0), p["title"] or ""))

    out_path = data_dir / "publications_clean.json"
    out_path.write_text(json.dumps(cleaned, indent=2, ensure_ascii=False))
    print(f"Kept {len(cleaned)} publications (excluded {len(works) - len(kept)}) -> {out_path}")


if __name__ == "__main__":
    main()
