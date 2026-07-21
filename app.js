async function main() {
  const res = await fetch('data.json');
  const data = await res.json();

  renderStats(data.stats);
  renderChart(data.cumulative_citations_by_year);
  renderPaperList(data.papers);
}

function renderStats(stats) {
  document.getElementById('stat-papers').textContent = stats.total_papers;
  document.getElementById('stat-citations').textContent = stats.total_citations.toLocaleString();
  document.getElementById('stat-hindex').textContent = stats.h_index;
}

function renderChart(series) {
  const svg = document.getElementById('chart-svg');
  const tooltip = document.getElementById('chart-tooltip');
  const width = 860;
  const height = 280;
  const margin = { top: 16, right: 16, bottom: 28, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const years = series.map(d => d.year);
  const maxCum = Math.max(...series.map(d => d.cumulative_citations));
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const x = year => margin.left + ((year - minYear) / (maxYear - minYear)) * innerW;
  const y = val => margin.top + innerH - (val / maxCum) * innerH;

  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  // Gradient def (resolve the CSS var to a concrete hex so SVG attrs render correctly)
  const accentBlue = getComputedStyle(document.documentElement).getPropertyValue('--accent-blue').trim() || '#2a78d6';
  const defs = el('defs', {});
  const grad = el('linearGradient', { id: 'areaGradient', x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.appendChild(el('stop', { offset: '0%', 'stop-color': accentBlue, 'stop-opacity': '0.28' }));
  grad.appendChild(el('stop', { offset: '100%', 'stop-color': accentBlue, 'stop-opacity': '0.02' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Gridlines + y-axis labels (4 ticks)
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const val = Math.round((maxCum / tickCount) * i);
    const gy = y(val);
    svg.appendChild(el('line', { x1: margin.left, x2: width - margin.right, y1: gy, y2: gy, class: 'chart-gridline' }));
    const label = el('text', { x: margin.left - 8, y: gy + 4, class: 'chart-axis-label', 'text-anchor': 'end' });
    label.textContent = val.toLocaleString();
    svg.appendChild(label);
  }

  // X-axis labels (every other year if crowded)
  const step = years.length > 10 ? 2 : 1;
  years.forEach((yr, i) => {
    if (i % step !== 0 && i !== years.length - 1) return;
    const label = el('text', { x: x(yr), y: height - 6, class: 'chart-axis-label', 'text-anchor': 'middle' });
    label.textContent = yr;
    svg.appendChild(label);
  });

  // Area path
  let areaPath = `M ${x(years[0])} ${y(0)}`;
  series.forEach(d => { areaPath += ` L ${x(d.year)} ${y(d.cumulative_citations)}`; });
  areaPath += ` L ${x(years[years.length - 1])} ${y(0)} Z`;
  svg.appendChild(el('path', { d: areaPath, class: 'chart-area' }));

  // Line path
  let linePath = '';
  series.forEach((d, i) => {
    linePath += (i === 0 ? 'M' : 'L') + ` ${x(d.year)} ${y(d.cumulative_citations)}`;
  });
  svg.appendChild(el('path', { d: linePath, class: 'chart-line' }));

  // Points + hover targets
  series.forEach(d => {
    const cx = x(d.year);
    const cy = y(d.cumulative_citations);
    const point = el('circle', { cx, cy, r: 3.5, class: 'chart-point' });
    svg.appendChild(point);

    const hitArea = el('rect', {
      x: cx - (innerW / years.length) / 2,
      y: margin.top,
      width: innerW / years.length,
      height: innerH,
      fill: 'transparent',
    });
    hitArea.addEventListener('mousemove', () => showTooltip(d, cx, cy));
    hitArea.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(hitArea);
  });

  function showTooltip(d, cx, cy) {
    const pct = Math.min(92, Math.max(8, (cx / width) * 100));
    tooltip.style.opacity = '1';
    tooltip.style.left = `${pct}%`;
    tooltip.style.top = `${(cy / height) * 100}%`;
    tooltip.textContent = `${d.year}: ${d.cumulative_citations.toLocaleString()} total citations (+${d.citations_that_year} that year)`;
  }
  function hideTooltip() { tooltip.style.opacity = '0'; }
}

// OpenAlex titles sometimes contain <i>/<sub> markup (species names, chemical
// formulas) or <scp> (small caps, dropped since it needs CSS support we don't
// ship). Escape all HTML, then restore only the tags we explicitly allow —
// never a general innerHTML pass.
function escapeExceptItalics(text) {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/&lt;(\/?)(i|sub)&gt;/g, '<$1$2>')
    .replace(/&lt;\/?scp&gt;/g, '');
}

function renderPaperList(papers) {
  window.__allPapers = papers;
  const list = document.getElementById('paper-list');
  const countEl = document.getElementById('filter-count');
  const sortSelect = document.getElementById('sort-select');
  const typeSelect = document.getElementById('type-select');

  function draw() {
    const sortBy = sortSelect.value;
    const typeFilter = typeSelect.value;

    let items = papers.filter(p => typeFilter === 'all' || p.type === typeFilter);

    items = items.slice().sort((a, b) => {
      if (sortBy === 'year-desc') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'year-asc') return (a.year || 0) - (b.year || 0);
      if (sortBy === 'citations-desc') return (b.cited_by_count || 0) - (a.cited_by_count || 0);
      if (sortBy === 'citations-asc') return (a.cited_by_count || 0) - (b.cited_by_count || 0);
      return 0;
    });

    list.innerHTML = '';
    items.forEach(p => {
      const li = document.createElement('li');
      li.className = 'paper-item';

      const titleEl = document.createElement(p.doi ? 'a' : 'div');
      titleEl.className = 'paper-title';
      titleEl.innerHTML = escapeExceptItalics(p.title);
      if (p.doi) {
        titleEl.href = p.doi;
        titleEl.target = '_blank';
        titleEl.rel = 'noopener';
      }
      li.appendChild(titleEl);

      const meta = document.createElement('div');
      meta.className = 'paper-meta';
      const typeLabel = p.type === 'data-paper' ? 'Data paper' : 'Article';
      meta.innerHTML = `<span class="type-chip">${typeLabel}</span>${p.venue || 'Unknown venue'} · ${p.year || 'n.d.'} · <span class="citation-badge">${p.cited_by_count || 0} citations</span>`;
      li.appendChild(meta);

      if (p.authors && p.authors.length) {
        const authorsEl = document.createElement('div');
        authorsEl.className = 'paper-authors';
        p.authors.forEach((name, i) => {
          const span = document.createElement('span');
          span.textContent = name;
          if (i === p.self_author_index) span.className = 'self-author';
          authorsEl.appendChild(span);
          if (i < p.authors.length - 1) authorsEl.appendChild(document.createTextNode(', '));
        });
        li.appendChild(authorsEl);
      }

      list.appendChild(li);
    });

    countEl.textContent = `${items.length} of ${papers.length} papers`;
  }

  sortSelect.addEventListener('change', draw);
  typeSelect.addEventListener('change', draw);
  draw();
}

main();
