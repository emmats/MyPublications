#!/usr/bin/env python3
"""Build data.json for the published site from data/publications_clean.json.

Usage:
    python3 build_site_data.py [data_dir] [site_data_path]

Computes: total papers, total citations, h-index, and a per-year cumulative
citation series (aggregated from each paper's OpenAlex counts_by_year).

Note: OpenAlex counts_by_year only covers roughly the last 10 years, so the
cumulative series undercounts citations accrued before that window for older
papers. This is noted in the output under "notes".
"""
import json
import sys
from pathlib import Path


def compute_h_index(citation_counts: list[int]) -> int:
    counts = sorted(citation_counts, reverse=True)
    h = 0
    for i, c in enumerate(counts, start=1):
        if c >= i:
            h = i
        else:
            break
    return h


def main():
    data_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "data"
    site_data_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "data.json"

    pubs = json.loads((data_dir / "publications_clean.json").read_text())

    total_papers = len(pubs)
    total_citations = sum(p["cited_by_count"] or 0 for p in pubs)
    h_index = compute_h_index([p["cited_by_count"] or 0 for p in pubs])

    citations_by_year: dict[int, int] = {}
    for p in pubs:
        for entry in p.get("counts_by_year", []):
            y = entry["year"]
            citations_by_year[y] = citations_by_year.get(y, 0) + entry["cited_by_count"]

    years_sorted = sorted(citations_by_year)
    cumulative = []
    running = 0
    for y in years_sorted:
        running += citations_by_year[y]
        cumulative.append({"year": y, "citations_that_year": citations_by_year[y], "cumulative_citations": running})

    papers_out = [
        {
            "title": p["title"],
            "year": p["year"],
            "venue": p["venue"],
            "type": p["type"],
            "authors": p["authors"],
            "self_author_index": p["self_author_index"],
            "cited_by_count": p["cited_by_count"],
            "doi": p["doi"],
        }
        for p in pubs
    ]
    papers_out.sort(key=lambda p: (p["year"] is None, -(p["year"] or 0)))

    most_cited = max(pubs, key=lambda p: p["cited_by_count"] or 0)

    out = {
        "generated_from": "OpenAlex (author A5038885394), verified against Weebly publications page",
        "stats": {
            "total_papers": total_papers,
            "total_citations": total_citations,
            "h_index": h_index,
            "most_cited_title": most_cited["title"],
            "most_cited_count": most_cited["cited_by_count"],
        },
        "cumulative_citations_by_year": cumulative,
        "papers": papers_out,
        "notes": [
            "Citation-by-year data comes from OpenAlex's counts_by_year field, which typically "
            "only covers roughly the last 10 years; citations to older papers accrued before "
            "that window are included in total counts but not in the earliest years of the chart."
        ],
    }

    site_data_path.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"Wrote site data ({total_papers} papers, {total_citations} citations, h-index {h_index}) -> {site_data_path}")


if __name__ == "__main__":
    main()
