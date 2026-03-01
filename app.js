/* ===== STATE ===== */
const state = {
  stack: [],       // array of compound IDs
  filter: 'all',   // category filter
  search: '',      // search query
};

/* ===== CATEGORY DOT COLOR MAP ===== */
const CAT_CLASS = {
  racetam:   'cat-racetam',
  choline:   'cat-choline',
  adaptogen: 'cat-adaptogen',
  amino:     'cat-amino',
  herb:      'cat-herb',
  vitamin:   'cat-vitamin',
  peptide:   'cat-peptide',
  other:     'cat-other',
};

/* ===== BENEFIT FILL COLOR MAP ===== */
const BENEFIT_CLASS = {
  focus:            'benefit-focus',
  memory:           'benefit-memory',
  mood:             'benefit-mood',
  sleep:            'benefit-sleep',
  anxiety:          'benefit-anxiety',
  energy:           'benefit-energy',
  neuroprotection:  'benefit-neuroprotection',
};

/* ===== UTILITY ===== */
function getCompound(id) {
  return NOOTROPICS.find(c => c.id === id);
}

function inStack(id) {
  return state.stack.includes(id);
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

/* ===== URL STATE ===== */
function encodeStack(ids) {
  return ids.join(',');
}

function decodeStack(str) {
  if (!str) return [];
  return str.split(',').filter(id => NOOTROPICS.some(c => c.id === id));
}

function saveToUrl() {
  const params = new URLSearchParams(window.location.search);
  if (state.stack.length > 0) {
    params.set('s', encodeStack(state.stack));
  } else {
    params.delete('s');
  }
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState(null, '', newUrl);
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  if (s) {
    state.stack = decodeStack(s);
  }
  if (params.get('embed') === '1') {
    document.body.classList.add('embed-mode');
  }
}

/* ===== COMPOUND BROWSER ===== */
function renderBrowser() {
  const grid = document.getElementById('compound-grid');
  const countEl = document.getElementById('compound-count');

  const q = state.search.toLowerCase();
  let visible = 0;

  Array.from(grid.querySelectorAll('.compound-card')).forEach(card => {
    const id = card.dataset.id;
    const compound = getCompound(id);
    if (!compound) return;

    const catMatch = state.filter === 'all' || compound.category === state.filter;
    const nameMatch = !q || compound.name.toLowerCase().includes(q);
    const hidden = !(catMatch && nameMatch);
    card.classList.toggle('hidden', hidden);
    card.classList.toggle('in-stack', inStack(id));
    if (!hidden) visible++;

    // update add button
    const btn = card.querySelector('.btn-add');
    if (btn) {
      btn.textContent = inStack(id) ? '✓ Added' : '+ Add';
      btn.classList.toggle('in-stack', inStack(id));
      btn.title = inStack(id) ? 'Click to remove' : 'Add to stack';
    }
  });

  countEl.textContent = visible;
}

function buildBrowser() {
  const grid = document.getElementById('compound-grid');
  grid.innerHTML = '';

  NOOTROPICS.forEach(compound => {
    const card = document.createElement('div');
    card.className = 'compound-card';
    card.dataset.id = compound.id;
    card.dataset.cat = compound.category;

    card.innerHTML = `
      <span class="compound-dot ${CAT_CLASS[compound.category] || 'cat-other'}"></span>
      <div class="compound-info">
        <div class="compound-name">${compound.name}</div>
        <div class="compound-dose">${compound.dose}</div>
      </div>
      <button class="btn btn-add" aria-label="Add ${compound.name} to stack">+ Add</button>
    `;

    // Add/remove on card click (except button — that's handled separately)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-add')) return;
      toggleCompound(compound.id);
    });

    card.querySelector('.btn-add').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompound(compound.id);
    });

    // Tooltip on hover
    card.addEventListener('mouseenter', (e) => showTooltip(e, compound));
    card.addEventListener('mousemove', (e) => moveTooltip(e));
    card.addEventListener('mouseleave', () => hideTooltip());

    grid.appendChild(card);
  });

  renderBrowser();
}

/* ===== TOOLTIP ===== */
const tooltip = document.getElementById('tooltip');

function showTooltip(e, compound) {
  tooltip.innerHTML = `
    <div class="tooltip-name">${compound.name}</div>
    <div class="tooltip-mechanism">${compound.mechanism}</div>
    ${compound.notes ? `<div style="margin-top:0.3rem;font-style:italic;color:var(--text-3)">${compound.notes}</div>` : ''}
    <div class="tooltip-meta">
      <span>Half-life: ${compound.halfLife}</span>
      <span>$${compound.costRange[0]}–$${compound.costRange[1]}/mo</span>
    </div>
  `;
  tooltip.style.display = 'block';
  moveTooltip(e);
}

function moveTooltip(e) {
  const margin = 12;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  if (x + tw > window.innerWidth - margin) x = e.clientX - tw - margin;
  if (y + th > window.innerHeight - margin) y = e.clientY - th - margin;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

/* ===== STACK ===== */
function toggleCompound(id) {
  if (inStack(id)) {
    removeFromStack(id);
  } else {
    addToStack(id);
  }
}

function addToStack(id) {
  if (!inStack(id)) {
    state.stack.push(id);
    saveToUrl();
    renderAll();
  }
}

function removeFromStack(id) {
  state.stack = state.stack.filter(s => s !== id);
  saveToUrl();
  renderAll();
}

function clearStack() {
  state.stack = [];
  saveToUrl();
  renderAll();
}

function renderStack() {
  const list = document.getElementById('stack-list');
  const empty = document.getElementById('stack-empty');
  const countEl = document.getElementById('stack-count');

  list.innerHTML = '';

  if (state.stack.length === 0) {
    empty.style.display = 'flex';
    countEl.textContent = '0 compounds';
    return;
  }

  empty.style.display = 'none';
  countEl.textContent = state.stack.length === 1 ? '1 compound' : `${state.stack.length} compounds`;

  state.stack.forEach(id => {
    const compound = getCompound(id);
    if (!compound) return;

    const item = document.createElement('div');
    item.className = 'stack-item';
    item.dataset.id = id;

    const benefitTags = compound.benefits.map(b =>
      `<span class="benefit-tag">${b}</span>`
    ).join('');

    item.innerHTML = `
      <span class="stack-item-dot ${CAT_CLASS[compound.category] || 'cat-other'}"></span>
      <div class="stack-item-info">
        <div class="stack-item-name">${compound.name}</div>
        <div class="stack-item-details">${compound.dose} · $${compound.costRange[0]}–$${compound.costRange[1]}/mo · ${compound.pillsPerDay} pill${compound.pillsPerDay !== 1 ? 's' : ''}/day</div>
        <div class="stack-item-benefits">${benefitTags}</div>
      </div>
      <button class="btn-remove" title="Remove from stack">✕</button>
    `;

    item.querySelector('.btn-remove').addEventListener('click', () => removeFromStack(id));

    list.appendChild(item);
  });
}

/* ===== INTERACTIONS ===== */
function getActiveInteractions() {
  const stackSet = new Set(state.stack);
  return INTERACTIONS.filter(interaction => {
    return interaction.compounds.every(id => stackSet.has(id));
  });
}

function renderInteractions() {
  const section = document.getElementById('interaction-section');
  const list = document.getElementById('interaction-list');

  const active = getActiveInteractions();

  if (state.stack.length < 2 || active.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = '';

  active.forEach(interaction => {
    const compoundNames = interaction.compounds.map(id => {
      const c = getCompound(id);
      return c ? c.name : id;
    }).join(' + ');

    const icon = interaction.type === 'synergy' ? '✓' : '⚠';
    const item = document.createElement('div');
    item.className = `interaction-item ${interaction.type}`;
    item.innerHTML = `
      <span class="interaction-icon">${icon}</span>
      <div class="interaction-text">
        <div class="interaction-compounds">${compoundNames} — ${interaction.title}</div>
        <div class="interaction-note">${interaction.description}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

/* ===== SUMMARY ===== */
function renderSummary() {
  const section = document.getElementById('summary-section');

  if (state.stack.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  const compounds = state.stack.map(getCompound).filter(Boolean);

  // Pills per day
  const totalPills = compounds.reduce((sum, c) => sum + c.pillsPerDay, 0);
  document.getElementById('stat-pills').textContent = totalPills;

  // Cost estimate
  const minCost = compounds.reduce((sum, c) => sum + c.costRange[0], 0);
  const maxCost = compounds.reduce((sum, c) => sum + c.costRange[1], 0);
  document.getElementById('stat-cost').textContent = `$${minCost}–${maxCost}`;

  // Compound count
  document.getElementById('stat-compounds').textContent = compounds.length;

  // Balance score: how evenly covered are the 7 benefits?
  const benefitKeys = Object.keys(BENEFITS);
  const coverage = {};
  benefitKeys.forEach(b => { coverage[b] = 0; });

  compounds.forEach(c => {
    c.benefits.forEach(b => {
      if (coverage[b] !== undefined) coverage[b]++;
    });
  });

  const values = benefitKeys.map(b => coverage[b]);
  const maxVal = Math.max(...values, 1);
  const normalised = values.map(v => v / maxVal);

  // Balance = how evenly distributed (0=all in one benefit, 10=perfectly even)
  const mean = normalised.reduce((a, b) => a + b, 0) / normalised.length;
  const variance = normalised.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / normalised.length;
  const balance = Math.max(0, Math.round(10 - variance * 40));
  document.getElementById('stat-score').textContent = `${balance}/10`;

  // Benefit bars
  const barsEl = document.getElementById('benefit-bars');
  barsEl.innerHTML = '';

  benefitKeys.forEach(key => {
    const count = coverage[key];
    const pct = Math.min(100, Math.round((count / Math.max(compounds.length, 1)) * 100));

    const row = document.createElement('div');
    row.className = 'benefit-row';
    row.innerHTML = `
      <span class="benefit-label">${BENEFITS[key].label}</span>
      <div class="benefit-track">
        <div class="benefit-fill ${BENEFIT_CLASS[key]}" style="width:${pct}%"></div>
      </div>
      <span class="benefit-pct">${pct}%</span>
    `;
    barsEl.appendChild(row);
  });
}

/* ===== RENDER ALL ===== */
function renderAll() {
  renderBrowser();
  renderStack();
  renderInteractions();
  renderSummary();
}

/* ===== SHARE ===== */
function getShareUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('s', encodeStack(state.stack));
  url.searchParams.delete('embed');
  return url.toString();
}

function getEmbedCode() {
  const url = new URL(window.location.href);
  url.searchParams.set('s', encodeStack(state.stack));
  url.searchParams.set('embed', '1');
  return `<iframe src="${url.toString()}" width="100%" height="700" frameborder="0" style="border-radius:12px;border:1px solid #2a2a2a;" title="Nootropic Stack Builder — Powered by NootroBlog"></iframe>`;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
    toast('Copied to clipboard');
  }).catch(() => {
    toast('Copy failed — select text manually');
  });
}

/* ===== MODALS ===== */
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Load state from URL
  loadFromUrl();

  // Build compound browser
  buildBrowser();

  // Render initial state
  renderAll();

  /* --- Search --- */
  document.getElementById('search').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderBrowser();
  });

  /* --- Category filter --- */
  document.getElementById('cat-filter').addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    state.filter = btn.dataset.cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBrowser();
  });

  /* --- Clear button --- */
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (state.stack.length === 0) return;
    if (confirm('Clear your entire stack?')) clearStack();
  });

  /* --- Share button --- */
  document.getElementById('btn-share').addEventListener('click', () => {
    if (state.stack.length === 0) {
      toast('Add compounds to your stack first');
      return;
    }
    document.getElementById('share-url').value = getShareUrl();
    openModal('share-modal');
  });

  /* --- Embed button --- */
  document.getElementById('btn-embed').addEventListener('click', () => {
    if (state.stack.length === 0) {
      toast('Add compounds to your stack first');
      return;
    }
    document.getElementById('embed-code').value = getEmbedCode();
    openModal('embed-modal');
  });

  /* --- Copy share URL --- */
  document.getElementById('btn-copy-url').addEventListener('click', (e) => {
    copyText(document.getElementById('share-url').value, e.currentTarget);
  });

  /* --- Copy embed code --- */
  document.getElementById('btn-copy-embed').addEventListener('click', (e) => {
    copyText(document.getElementById('embed-code').value, e.currentTarget);
  });

  /* --- Modal close buttons --- */
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.modal);
    });
  });

  /* --- Close modal on backdrop click --- */
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = 'none';
      }
    });
  });

  /* --- Close modal on Escape --- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => {
        m.style.display = 'none';
      });
    }
  });

  /* --- Nav scroll border --- */
  window.addEventListener('scroll', () => {
    document.getElementById('nav').style.borderBottomColor =
      window.scrollY > 20 ? 'var(--border-2)' : 'var(--border)';
  }, { passive: true });
});
