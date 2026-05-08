(async function () {
  const FAMILY_COLORS = {
    'persona-roleplay': '#6c8cff',
    'context-manipulation': '#9a6cff',
    'obfuscation': '#00b3a6',
    'optimization': '#ff7a59',
    'llm-as-attacker': '#ffb454',
    'fine-tuned-attacker': '#d27dff',
    'prompt-injection': '#ff5c8a',
    'multimodal': '#43d17a',
    'weight-attack': '#ff4d6d',
    'decoding-attack': '#56c0ff'
  };

  const EDGE_COLORS = {
    'evolved-from': '#6c8cff',
    'inspired-by': '#5d6478',
    'generalizes': '#9a6cff',
    'combines': '#43d17a',
    'defense-bypass-of': '#ff5c8a'
  };

  // load data
  const [nodes, edges, models] = await Promise.all([
    fetch('data/nodes.json').then(r => r.json()),
    fetch('data/edges.json').then(r => r.json()),
    fetch('data/models.json').then(r => r.json())
  ]);

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

  // ASR-based tiering. Returns 'high'|'medium'|'low'|'unknown'.
  function asrTier(asr) {
    if (asr == null) return 'unknown';
    if (asr >= 50) return 'high';
    if (asr >= 10) return 'medium';
    return 'low';
  }

  // For graph filter compatibility: derive a coarse status label from ASR entries.
  function aggregateStatus(node) {
    const known = (node.status || []).filter(s => typeof s.asr === 'number');
    if (!known.length) return 'unverified';
    const max = Math.max(...known.map(s => s.asr));
    const tier = asrTier(max);
    return tier === 'high' ? 'vulnerable'
      : tier === 'medium' ? 'partially-patched'
      : 'patched';
  }

  // Defender coverage — average of (100 - asr) across verified entries, scaled to 0..1.
  // Returns null when no verified entries exist (renders as a striped/empty bar).
  function defenderCoverage(node) {
    const known = (node.status || []).filter(s => typeof s.asr === 'number');
    if (!known.length) return null;
    const avg = known.reduce((a, s) => a + (100 - s.asr), 0) / known.length;
    return Math.max(0, Math.min(1, avg / 100));
  }

  function progressSvg(width, pct) {
    const w = Math.max(120, width);
    const barW = w - 24;
    const trackY = 0;
    if (pct == null) {
      // unknown — striped, no fill
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='8'>
        <defs><pattern id='stripe' patternUnits='userSpaceOnUse' width='6' height='6' patternTransform='rotate(45)'>
          <rect width='6' height='6' fill='rgba(255,255,255,0.10)'/>
          <line x1='0' y1='0' x2='0' y2='6' stroke='rgba(255,255,255,0.22)' stroke-width='2'/>
        </pattern></defs>
        <rect x='12' y='${trackY}' width='${barW}' height='6' rx='3' ry='3' fill='url(#stripe)'/>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    const fillW = Math.round(barW * pct);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='8'>
      <rect x='12' y='${trackY}' width='${barW}' height='6' rx='3' ry='3' fill='rgba(255,255,255,0.18)'/>
      <rect x='12' y='${trackY}' width='${fillW}' height='6' rx='3' ry='3' fill='#3ed17a'/>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // build cytoscape elements
  const elements = [
    ...nodes.map(n => ({
      data: {
        id: n.id,
        label: n.name,
        family: n.family,
        confidence: n.confidence,
        status: aggregateStatus(n),
        node: n
      }
    })),
    ...edges.map((e, i) => ({
      data: {
        id: 'e' + i,
        source: e.from,
        target: e.to,
        type: e.type,
        note: e.note
      }
    }))
  ];

  // populate family filter
  const familySel = document.getElementById('family-filter');
  [...new Set(nodes.map(n => n.family))].sort().forEach(f => {
    const opt = document.createElement('option');
    opt.value = f; opt.textContent = f.replace(/-/g, ' ');
    familySel.appendChild(opt);
  });

  const cy = window.cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    minZoom: 0.3,
    maxZoom: 2.5,
    wheelSensitivity: 0.3,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#3a3ee0',
          'background-image': ele => progressSvg(180, defenderCoverage(ele.data('node'))),
          'background-fit': 'none',
          'background-clip': 'none',
          'background-image-containment': 'over',
          'background-position-x': '50%',
          'background-position-y': '88%',
          'background-width': '100%',
          'background-height': '8px',
          'label': 'data(label)',
          'color': '#ffffff',
          'font-size': '13px',
          'font-weight': 700,
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': '160px',
          'text-margin-y': -8,
          'width': 200,
          'height': 76,
          'shape': 'round-rectangle',
          'border-width': 0,
          'underlay-color': '#000000',
          'underlay-opacity': 0.45,
          'underlay-padding': 6,
          'transition-property': 'background-color, underlay-opacity',
          'transition-duration': '0.15s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'background-color': '#5258ff',
          'underlay-opacity': 0.7,
          'underlay-padding': 9
        }
      },
      {
        selector: 'node.dim',
        style: { 'opacity': 0.18 }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'width': 3,
          'line-color': '#ffffff',
          'target-arrow-color': '#ffffff',
          'target-arrow-shape': 'triangle',
          'target-arrow-fill': 'filled',
          'arrow-scale': 1.5,
          'opacity': 0.85,
          'line-style': 'solid'
        }
      },
      {
        selector: 'edge.dim',
        style: { 'opacity': 0.1 }
      },
      {
        selector: 'edge.highlight',
        style: { 'opacity': 1, 'width': 4 }
      }
    ],
    layout: {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 60,
      rankSep: 90,
      edgeSep: 20
    }
  });

  // panel logic
  const panel = document.getElementById('panel');
  const panelContent = document.getElementById('panel-content');
  document.getElementById('close-panel').onclick = () => closePanel();

  function closePanel() {
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');
    cy.elements().removeClass('dim highlight');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function renderNode(n) {
    const family = n.family;
    const familyColor = FAMILY_COLORS[family] || '#6c8cff';

    const parents = edges.filter(e => e.to === n.id).map(e => ({ ...e, node: nodeById[e.from] }));
    const children = edges.filter(e => e.from === n.id).map(e => ({ ...e, node: nodeById[e.to] }));

    const statusRows = (n.status || []).map(s => {
      const hasAsr = typeof s.asr === 'number';
      const tier = hasAsr ? asrTier(s.asr) : 'unknown';
      const pill = hasAsr
        ? `<span class="asr-pill ${tier}">ASR ${s.asr.toFixed(s.asr < 10 ? 1 : 0)}%</span>`
        : `<span class="asr-pill unknown">unknown</span>`;
      const sourceLine = s.source
        ? `<div style="color:var(--muted);font-size:11px;margin-top:2px">${s.eval ? escapeHtml(s.eval) + ' · ' : ''}${s.source_url ? `<a href="${escapeHtml(s.source_url)}" target="_blank" rel="noopener">${escapeHtml(s.source)}</a>` : escapeHtml(s.source)}</div>`
        : '';
      return `<tr>
        <td>${escapeHtml(s.model)}<br/><span style="color:var(--muted);font-size:11px">${escapeHtml(s.version || '')}</span></td>
        <td>${pill}${sourceLine}</td>
      </tr>`;
    }).join('');

    const verifiedCount = (n.status || []).filter(s => typeof s.asr === 'number').length;
    const coverageNote = verifiedCount === 0
      ? '<div class="coverage-empty">no public ASR data — progress bar shows striped pattern</div>'
      : `<div class="coverage-note">averaged across ${verifiedCount} verified entr${verifiedCount === 1 ? 'y' : 'ies'}</div>`;

    const lineageHtml = `
      ${parents.length ? `<div class="lineage"><strong>parents:</strong> ${parents.map(p => `<a href="#" data-jump="${p.node.id}">${escapeHtml(p.node.name)}</a><span class="arrow"> (${p.type})</span>`).join(', ')}</div>` : ''}
      ${children.length ? `<div class="lineage" style="margin-top:6px"><strong>children:</strong> ${children.map(c => `<a href="#" data-jump="${c.node.id}">${escapeHtml(c.node.name)}</a><span class="arrow"> (${c.type})</span>`).join(', ')}</div>` : ''}
    `;

    panelContent.innerHTML = `
      <h2>${escapeHtml(n.name)}<span class="confidence">${escapeHtml(n.confidence)}</span></h2>
      <span class="family" style="background:${familyColor}22;color:${familyColor}">${escapeHtml(family.replace(/-/g,' '))}</span>
      <p class="mech">${escapeHtml(n.mechanism)}</p>

      ${lineageHtml ? `<h3>lineage</h3>${lineageHtml}` : ''}

      <h3>origin</h3>
      <div>${escapeHtml(n.origin.title)}<br/>
        <span style="color:var(--muted);font-size:12px">${(n.origin.authors || []).join(', ')} · ${escapeHtml(n.origin.date || '')}</span><br/>
        ${n.origin.url ? `<a href="${escapeHtml(n.origin.url)}" target="_blank" rel="noopener">${escapeHtml(n.origin.url)}</a>` : ''}
      </div>

      ${statusRows ? `<h3>per-model attack success rate (ASR)</h3>${coverageNote}<table class="status-table"><tbody>${statusRows}</tbody></table>` : `<h3>per-model attack success rate (ASR)</h3><div class="coverage-empty">no public ASR data found — every cell unknown</div>`}

      ${n.defenses && n.defenses.length ? `<h3>known defenses</h3><div class="tags">${n.defenses.map(d => `<span class="tag">${escapeHtml(d)}</span>`).join('')}</div>` : ''}

      ${n.tags && n.tags.length ? `<h3>tags</h3><div class="tags">${n.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    `;

    panelContent.querySelectorAll('a[data-jump]').forEach(a => {
      a.addEventListener('click', ev => {
        ev.preventDefault();
        const id = a.getAttribute('data-jump');
        selectNode(id);
      });
    });

    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
  }

  function selectNode(id) {
    const node = cy.getElementById(id);
    if (!node || node.empty()) return;
    cy.elements().removeClass('dim highlight');
    const neighborhood = node.closedNeighborhood();
    cy.elements().difference(neighborhood).addClass('dim');
    neighborhood.edges().addClass('highlight');
    cy.animate({ center: { eles: node }, zoom: 1.0 }, { duration: 250 });
    renderNode(nodeById[id]);
  }

  cy.on('tap', 'node', evt => selectNode(evt.target.id()));
  cy.on('tap', evt => { if (evt.target === cy) closePanel(); });

  // search
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) { cy.elements().removeClass('dim'); return; }
    cy.nodes().forEach(n => {
      const data = n.data('node');
      const haystack = [data.name, data.mechanism, data.family, ...(data.tags || [])].join(' ').toLowerCase();
      if (haystack.includes(q)) n.removeClass('dim'); else n.addClass('dim');
    });
  });

  // family filter
  familySel.addEventListener('change', () => applyFilters());
  document.getElementById('status-filter').addEventListener('change', () => applyFilters());

  function nodeAsrTier(node) {
    const known = (node.status || []).filter(s => typeof s.asr === 'number');
    if (!known.length) return 'unknown';
    return asrTier(Math.max(...known.map(s => s.asr)));
  }

  function applyFilters() {
    const fam = familySel.value;
    const stat = document.getElementById('status-filter').value;
    cy.nodes().forEach(n => {
      const data = n.data('node');
      const okFam = !fam || data.family === fam;
      const okStat = !stat || nodeAsrTier(data) === stat;
      if (okFam && okStat) n.removeClass('dim'); else n.addClass('dim');
    });
  }

  // reset
  document.getElementById('reset-view').onclick = () => {
    closePanel();
    cy.elements().removeClass('dim highlight');
    cy.fit(undefined, 60);
  };

  // ------- frontier matrix --------
  const NOW = new Date('2026-05-07');
  const STALE_MONTHS = 12;

  function parseStatusDate(versionStr) {
    if (!versionStr) return null;
    const m = String(versionStr).match(/(\d{4})-(\d{2})/) || String(versionStr).match(/(\d{4})/);
    if (!m) return null;
    const year = parseInt(m[1]);
    const month = m[2] ? parseInt(m[2]) : 6;
    return new Date(year, month - 1, 1);
  }

  function monthsBetween(a, b) {
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  }

  // For (node, model): find the most relevant ASR entry by walking aliases in priority order.
  // When multiple entries share an alias, pick the latest by version date.
  function statusFor(node, model) {
    const statuses = (node.status || []).filter(s => typeof s.asr === 'number');
    for (const alias of model.aliases) {
      const hits = statuses.filter(s => s.model === alias);
      if (hits.length) {
        const ranked = hits
          .map(s => ({ s, d: parseStatusDate(s.version) }))
          .sort((a, b) => (b.d?.getTime() || 0) - (a.d?.getTime() || 0));
        const { s, d } = ranked[0];
        const stale = d ? monthsBetween(d, NOW) > STALE_MONTHS : true;
        return { asr: s.asr, version: s.version, modelTested: s.model, eval: s.eval, source: s.source, source_url: s.source_url, stale };
      }
    }
    return null;
  }

  function renderMatrix() {
    const tbl = document.getElementById('matrix-table');
    const headerCells = ['<th class="tech-col">technique</th>']
      .concat(models.map(m => `<th class="model-col" style="border-bottom-color:${m.color}">
        <div class="model-name">${escapeHtml(m.name)}</div>
        <div class="model-vendor">${escapeHtml(m.vendor)}</div>
      </th>`));
    const headerRow = `<thead><tr>${headerCells.join('')}</tr></thead>`;

    // also render summary row
    const summary = models.map(m => {
      const cells = nodes.map(n => statusFor(n, m));
      const verified = cells.filter(c => c);
      const high = verified.filter(c => asrTier(c.asr) === 'high').length;
      const med = verified.filter(c => asrTier(c.asr) === 'medium').length;
      const low = verified.filter(c => asrTier(c.asr) === 'low').length;
      const unknown = nodes.length - verified.length;
      const avg = verified.length ? (verified.reduce((a, c) => a + c.asr, 0) / verified.length) : null;
      return `<th class="summary-cell"><div class="summary-pills">
        ${avg != null ? `<span class="asr-pill ${asrTier(avg)}" title="mean ASR across verified entries">avg ${avg.toFixed(0)}%</span>` : ''}
        <span class="asr-pill high">${high} ≥50%</span>
        <span class="asr-pill medium">${med} 10–50%</span>
        <span class="asr-pill low">${low} &lt;10%</span>
        <span class="asr-pill unknown">${unknown} unknown</span>
      </div></th>`;
    });
    const summaryRow = `<tr class="summary-row"><th class="tech-col">summary (n=${nodes.length})</th>${summary.join('')}</tr>`;

    const sortedNodes = [...nodes].sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));
    const bodyRows = sortedNodes.map(n => {
      const cells = models.map(m => {
        const s = statusFor(n, m);
        if (!s) return '<td class="cell empty" title="no public eval data">—</td>';
        const tier = asrTier(s.asr);
        const evalLabel = s.eval ? ` · ${s.eval}` : '';
        const titleAttr = `${s.modelTested} ${s.version || ''}${evalLabel} · source: ${s.source || ''}`;
        return `<td class="cell ${s.stale ? 'stale' : ''}" title="${escapeHtml(titleAttr)}">
          <span class="asr-pill ${tier}">ASR ${s.asr.toFixed(s.asr < 10 ? 1 : 0)}%</span>
          <div class="cell-evidence">${escapeHtml(s.modelTested)} · ${escapeHtml(s.version || '')}</div>
        </td>`;
      });
      const familyColor = FAMILY_COLORS[n.family] || '#6c8cff';
      return `<tr data-node="${n.id}">
        <td class="tech-col">
          <span class="family-stripe" style="background:${familyColor}"></span>
          <a href="#" class="tech-link" data-jump="${n.id}">${escapeHtml(n.name)}</a>
          <div class="tech-family">${escapeHtml(n.family.replace(/-/g, ' '))}</div>
        </td>
        ${cells.join('')}
      </tr>`;
    });

    tbl.innerHTML = headerRow + `<tbody>${summaryRow}${bodyRows.join('')}</tbody>`;

    tbl.querySelectorAll('a.tech-link').forEach(a => {
      a.addEventListener('click', ev => {
        ev.preventDefault();
        closeMatrix();
        selectNode(a.getAttribute('data-jump'));
      });
    });
  }

  const matrixModal = document.getElementById('matrix-modal');
  function openMatrix() {
    renderMatrix();
    matrixModal.classList.remove('hidden');
    matrixModal.setAttribute('aria-hidden', 'false');
  }
  function closeMatrix() {
    matrixModal.classList.add('hidden');
    matrixModal.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('open-matrix').onclick = openMatrix;
  document.getElementById('close-matrix').onclick = closeMatrix;
  matrixModal.addEventListener('click', ev => { if (ev.target === matrixModal) closeMatrix(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeMatrix(); closePanel(); } });
  // -------------------------------

  // fit after layout actually finishes, and on window resize
  cy.one('layoutstop', () => cy.fit(undefined, 60));
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { cy.resize(); cy.fit(undefined, 60); }, 100);
  });
})();
