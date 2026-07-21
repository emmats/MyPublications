# Publications site

Goal: Create a page of papers with citation charts, published live.

This file is kept up to date as work progresses, so the process can be understood and re-run later.

Steps (wait for approval between each):
1. [x] Gather publication list — OpenAlex (author A5038885394), verified against Weebly page. 41 papers confirmed.
   - `scripts/fetch_openalex_works.py A5038885394` — fetches + filters raw OpenAlex works.
   - `scripts/build_publications_list.py` — de-dupes to the 41 confirmed papers -> `data/publications_clean.json` (includes `counts_by_year` per paper).
   - `scripts/build_publications_xlsx.py` — exports title/year/venue/type/co-authors -> `data/publications.xlsx`.
2. [x] Pull per-year citation history (`counts_by_year`) for each paper from OpenAlex.
   - `scripts/build_site_data.py` — aggregates `counts_by_year` across papers into a cumulative-citations-by-year series, computes total papers/citations/h-index -> `data.json` (consumed directly by the site).
3. [x] Build the web page (list of papers + citation growth charts).
   - Design brief: modern portfolio style, ocean/marine palette, clean sans-serif type, header with photo/bio/links (ORCID, Weebly, ResearchGate), 3 stat tiles (papers/citations/h-index), cumulative citation line+area chart with hover tooltips, sortable/filterable flat paper list (sort by year or citations, filter by type).
   - Files: `index.html`, `styles.css`, `app.js`, `data.json`, `assets/headshot.jpg`.
   - Re-run the full pipeline: `python3 -X utf8 scripts/fetch_openalex_works.py A5038885394 data && python3 -X utf8 scripts/build_publications_list.py && python3 -X utf8 scripts/build_publications_xlsx.py && python3 -X utf8 scripts/build_site_data.py`.
   - Local preview: `python3 -m http.server 8743` from the `MyPublications` directory (fetch() of `data.json` needs http://, not file://).
4. [x] Publish live — GitHub Pages (legacy/branch build from `main` at `/`), enabled via:
   `gh api -X PUT repos/emmats/MyPublications/pages -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/"`
   Live at https://emmats.github.io/MyPublications/

Done. To refresh the site with new publications/citations later: re-run the pipeline commands in step 3, review locally, commit, push to `main` — GitHub Pages rebuilds automatically on push.
