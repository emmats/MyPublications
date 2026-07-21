#!/usr/bin/env python3
"""Fetch all works for an OpenAlex author ID and save raw + filtered results.

Usage:
    python3 fetch_openalex_works.py <openalex_author_id> [output_dir]

Example:
    python3 fetch_openalex_works.py A5038885394 ../data
"""
import json
import sys
import urllib.request
from pathlib import Path

KEEP_TYPES = {"article", "book-chapter", "data-paper"}


def fetch_all_works(author_id: str) -> list[dict]:
    works = []
    cursor = "*"
    base = f"https://api.openalex.org/works?filter=author.id:{author_id}&per-page=200&cursor="
    while cursor:
        with urllib.request.urlopen(base + cursor) as resp:
            payload = json.load(resp)
        works.extend(payload["results"])
        cursor = payload["meta"].get("next_cursor")
        if not payload["results"]:
            break
    return works


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    author_id = sys.argv[1]
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    works = fetch_all_works(author_id)
    (out_dir / "openalex_works_raw.json").write_text(json.dumps(works, indent=2))
    print(f"Fetched {len(works)} raw works -> {out_dir / 'openalex_works_raw.json'}")

    filtered = [w for w in works if w.get("type") in KEEP_TYPES]
    (out_dir / "openalex_works_filtered.json").write_text(json.dumps(filtered, indent=2))
    print(f"Filtered to {len(filtered)} articles/book-chapters/data-papers -> {out_dir / 'openalex_works_filtered.json'}")


if __name__ == "__main__":
    main()
