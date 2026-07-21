# Publications site

Goal: Create a page of papers with citation charts, published live.

This file is kept up to date as work progresses, so the process can be understood and re-run later.

Steps (wait for approval between each):
1. [x] Gather publication list — OpenAlex (author A5038885394), verified against Weebly page. 41 papers confirmed.
   - `scripts/fetch_openalex_works.py A5038885394` — fetches + filters raw OpenAlex works.
   - `scripts/build_publications_list.py` — de-dupes to the 41 confirmed papers -> `data/publications_clean.json` (includes `counts_by_year` per paper).
   - `scripts/build_publications_xlsx.py` — exports title/year/venue/type/co-authors -> `data/publications.xlsx`.
2. [ ] Pull per-year citation history (`counts_by_year`) for each paper from OpenAlex (already captured in `publications_clean.json`; still need to aggregate into a total-citations-by-year series for the chart).
3. [ ] Build the web page (list of papers + citation growth charts).
4. [ ] Publish live.
