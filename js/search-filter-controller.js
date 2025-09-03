/**
 * Search and Filter Controller for Family Members
 * Handles search functionality, filtering, and spotlight features
 */

// Global state
const state = {
  members: [],
  cards: new Map(),
  query: '',
  spotlightId: null,
  suggestionIndex: [],
  lastQuery: ''
};

/**
 * Get the appropriate display name for a person
 * Children in unions always show their birth name (name)
 * All other contexts show legal name if available, otherwise birth name
 */
function getDisplayName(person, context = 'default') {
  if (!person) return '';
  
  // Children contexts always show birth name
  if (context === 'children') {
    return person.name || '';
  }
  
  // All other contexts show legal name with fallback to birth name
  return person.legalName || person.name;
}

(function () {
  'use strict';

  // Utilities
  function normalize(text) {
    return (text || '')
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(Boolean);
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const v0 = new Array(b.length + 1);
    const v1 = new Array(b.length + 1);
    for (let i = 0; i < v0.length; i++) v0[i] = i;
    for (let i = 0; i < a.length; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < b.length; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
    }
    return v1[b.length];
  }

  function fuzzyContains(needle, haystack) {
    if (haystack.includes(needle)) return true;
    const tokens = haystack.split(/\s+/);
    for (const t of tokens) {
      if (t.includes(needle) || needle.includes(t)) return true;
      if (Math.min(t.length, needle.length) >= 3 && levenshtein(needle, t) <= 2) return true;
    }
    return false;
  }

  // Highlight helper
  function highlightHtml(text, query) {
    if (!query) return escapeHtml(text);
    const q = normalize(query);
    if (!q) return escapeHtml(text);

    const parts = tokenize(query)
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);
    if (parts.length === 0) return escapeHtml(text);

    const original = text || '';
    const norm = normalize(original);

    const ranges = [];
    parts.forEach(part => {
      let start = 0;
      while (start <= norm.length) {
        const idx = norm.indexOf(part.toLowerCase(), start);
        if (idx === -1) break;
        ranges.push([idx, idx + part.length]);
        start = idx + part.length;
      }
    });

    if (ranges.length === 0) return escapeHtml(original);

    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) {
      if (!merged.length || r[0] > merged[merged.length - 1][1]) {
        merged.push(r.slice());
      } else {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
      }
    }

    const map = [];
    {
      const originalChars = Array.from(original);
      const normChars = normalize(original).split('');
      let o = 0, n = 0;
      while (o < originalChars.length && n < normChars.length) {
        map[n] = o;
        n = n + 1;
        o = o + 1;
      }
      map[normChars.length] = originalChars.length;
    }

    let result = '';
    let cursor = 0;
    merged.forEach(([ns, ne]) => {
      const os = map[ns] ?? ns;
      const oe = map[ne] ?? ne;
      if (os > cursor) result += escapeHtml(original.slice(cursor, os));
      result += '<strong>' + escapeHtml(original.slice(os, oe)) + '</strong>';
      cursor = oe;
    });
    if (cursor < original.length) result += escapeHtml(original.slice(cursor));
    return result;
  }

  function escapeHtml(s) {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Controller
  const state = {
    members: [],
    cards: new Map(), // id -> { el, nameEl }
    generationFilter: null,
    query: '',
    spotlightId: null,
    suggestionsEl: null,
    suggestionIndex: [] // { id, name, generation, type: 'member'|'partner' }
  };

  function buildIndex(members) {
    state.members = members.map(m => ({
      id: m.id,
      name: m.name || '',
      legalName: m.legalName || null,
      generation: m.generation ?? null,
      birthDate: m.birthDate || '',
      deathDate: m.deathDate || '',
      birthLocation: m.birthLocation || '',
      deathLocation: m.deathLocation || '',
      partners: (m.unions || []).map(u => (u && u.partner && u.partner.name) ? u.partner.name : '').filter(Boolean)
    }));

    // Build suggestion index (members + partners as separate entries)
    state.suggestionIndex = [];
    state.members.forEach(m => {
      state.suggestionIndex.push({ id: m.id, name: m.name, generation: m.generation, type: 'member' });
      m.partners.forEach(p => {
        state.suggestionIndex.push({ id: m.id, name: p, generation: m.generation, type: 'partner' });
      });
    });

    document.querySelectorAll('.family-members .person-card').forEach(card => {
      const id = card.getAttribute('data-id');
      const nameEl = card.querySelector('.person-name');
      if (id) state.cards.set(id, { el: card, nameEl });
    });

  }



  function applyFilters() {
    const q = normalize(state.query);
    const gen = state.generationFilter;

    // Clear dimming
    state.cards.forEach(({ el }) => el.classList.remove('dimmed', 'spotlight'));

    // Apply generation filter
    state.members.forEach(m => {
      const card = state.cards.get(m.id);
      if (!card) return;
      
      // Generation filter
      const genOk = gen == null || String(m.generation) === String(gen);
      
      // Show card only if generation filter passes
      card.el.style.display = genOk ? '' : 'none';
    });

          // No query → just apply generation filter, reset highlights
      if (!q) {
        let visibleCount = 0;
        state.members.forEach(m => {
          const card = state.cards.get(m.id);
          if (!card) return;
          if (card.el.style.display !== 'none') {
            if (card.nameEl) card.nameEl.textContent = getDisplayName(m);
            visibleCount++;
          }
        });
        updateCounter(`${visibleCount} membro${visibleCount !== 1 ? 's' : ''} da família encontrado${visibleCount !== 1 ? 's' : ''}`);
        state.spotlightId = null;
        hideSuggestions();
        return;
      }

    // Exact match resolution (consider members and partners)
    const exactMatches = state.suggestionIndex.filter(e => normalize(e.name) === q);
    if (exactMatches.length === 1) {
      const target = exactMatches[0];
      const member = state.members.find(mm => mm.id === target.id) || { id: target.id, name: target.name, generation: target.generation };
      
      // Check if person is hidden by current generation filter
      const cardEntry = state.cards.get(member.id);
      const isHiddenByFilter = cardEntry && cardEntry.el && cardEntry.el.style.display === 'none';
      
      // If hidden by generation filter, automatically clear it
      if (isHiddenByFilter && state.generationFilter !== null) {
        const buttons = document.querySelectorAll('.filter-buttons .filter-btn');
        const allGenerationsButton = Array.from(buttons).find(b => 
          (b.textContent || '').includes('Todas')
        );
        if (allGenerationsButton) {
          allGenerationsButton.click();
        }
      }
      
      state.spotlightId = target.id;
      hideSuggestions();
      
      // Small delay to ensure filter has been applied before spotlight
      setTimeout(() => {
        runSpotlight(member);
      }, 50);
      return;
    }

    // Multiple exacts or no exacts: show suggestions but do not alter grid visibility (no filtering)
    const suggestions = scoreSuggestions(q, state.suggestionIndex).slice(0, 10);
    showSuggestions(suggestions);

    // Just highlight partial matches in names, do not hide/dim
    let count = 0;
    state.members.forEach(m => {
      const card = state.cards.get(m.id);
      if (!card) return;
      if (card.el.style.display !== 'none') { // Only process visible cards
        if (card.nameEl) {
          if (fuzzyContains(q, normalize(getDisplayName(m)))) {
            card.nameEl.innerHTML = highlightHtml(getDisplayName(m), state.query);
          } else {
            card.nameEl.textContent = getDisplayName(m);
          }
        }
        count++;
      }
    });
    updateCounter(`Sugestões: ${suggestions.length}${suggestions[0] ? ` • Melhor: ${getDisplayName(suggestions[0])}` : ''}`);
  }

  function scoreSuggestions(q, entries) {
    const results = [];
    for (const m of entries) {
      const hay = normalize(m.name);
      let score = 0;
      if (hay === q) score = 1000;
      else if (hay.includes(q)) score = 100 + q.length;
      else {
        const words = tokenize(q);
        score = words.reduce((acc, w) => acc + Math.max(0, 10 - Math.min(levenshtein(w, hay), 10)), 0);
      }
      if (score > 0) results.push({ ...m, score });
    }
    return results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  function runSpotlight(member) {
    // Skip the toast notification logic since we now automatically clear filters
    // when clicking search results. This provides a smoother user experience.
    // Build relatives set (children by id)
    const relativeIds = new Set();
    try {
      const full = state.members.find(mm => mm.id === member.id);
      // We stored only partner names, but the DOM has child tags with data-id; spotlight relatives by child ids in DOM layer below
    } catch {}

    // Apply spotlight highlighting (dimming others, highlighting target and relatives)
    state.members.forEach(m => {
      const card = state.cards.get(m.id);
      if (!card) return;

      const isSpot = m.id === member.id;
      let isRelative = false;
      // Detect children by DOM tags inside the spotlight card
      if (isSpot) {
        const spotCard = card.el;
        spotCard.querySelectorAll('.children-section .child-tag').forEach(tag => {
          const cid = tag.getAttribute('data-id');
          if (cid && state.cards.has(cid)) relativeIds.add(cid);
        });
      }
      if (relativeIds.has(m.id)) isRelative = true;

      // Apply dimming to non-spotlighted cards (only if card is visible due to generation filter)
      if (card.el.style.display !== 'none') {
        if (!isSpot && !isRelative) {
          card.el.classList.add('dimmed');
        }
      }

      // Highlight names within spotlight card and relatives
      if (card.nameEl) {
        if (isSpot || isRelative) card.nameEl.innerHTML = highlightHtml(getDisplayName(m), getDisplayName(member));
        else card.nameEl.textContent = getDisplayName(m);
      }
    });

    // Enhance in-card highlighting for spotlight: spouse names and children labels
    const spot = state.cards.get(member.id);
    if (spot) {
      spot.el.classList.add('spotlight');
      // Spouse
      spot.el.querySelectorAll('.spouse-name, .spouse-details').forEach(el => {
        el.innerHTML = highlightHtml(el.textContent || '', state.query);
      });
      // Children
      spot.el.querySelectorAll('.children-list .child-tag').forEach(el => {
        el.innerHTML = highlightHtml(el.textContent || '', state.query);
      });

      // Scroll into view
      spot.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      updateCounter(`Destacado: ${getDisplayName(member)}`);
    }

    // Auto-clear highlight/dimming after 4s
    setTimeout(() => {
      // Remove dimming and spotlight
      state.cards.forEach(({ el }) => el.classList.remove('dimmed', 'spotlight'));
      // Restore names
      state.members.forEach(m => {
        const c = state.cards.get(m.id);
        if (!c) return;
        if (c.nameEl) c.nameEl.textContent = getDisplayName(m);
      });
      // Remove <strong> from spouse/children sections
      if (spot && spot.el) {
        spot.el.querySelectorAll('.spouse-name, .spouse-details, .children-list .child-tag').forEach(el => {
          el.querySelectorAll('strong').forEach(s => {
            const parent = s.parentNode;
            while (s.firstChild) parent.insertBefore(s.firstChild, s);
            parent.removeChild(s);
          });
        });
      }
      updateCounter('');
    }, 4000);
  }

  function updateCounter(text) {
    const counter = document.querySelector('.results-counter span') || document.querySelector('.results-counter');
    if (counter) counter.textContent = text;
  }

  // Toast with one or two actions
  function showActionToast(message, primaryLabel, onPrimary, onUndo) {
    const el = document.createElement('div');
    el.className = 'share-notification';
    const msg = document.createElement('span');
    msg.textContent = message;
    el.appendChild(msg);
    if (primaryLabel && onPrimary) {
      const btn = document.createElement('button');
      btn.textContent = primaryLabel;
      btn.style.marginLeft = '12px';
      btn.style.padding = '4px 8px';
      btn.style.border = '1px solid rgba(255,255,255,.6)';
      btn.style.background = 'transparent';
      btn.style.color = 'inherit';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';
      btn.onclick = () => { try{ onPrimary(); }catch{} el.classList.remove('show'); setTimeout(()=>el.remove(), 250); };
      el.appendChild(btn);
    }
    if (onUndo) {
      const undo = document.createElement('button');
      undo.textContent = 'Desfazer';
      undo.style.marginLeft = '8px';
      undo.style.padding = '4px 8px';
      undo.style.border = '1px solid rgba(255,255,255,.6)';
      undo.style.background = 'transparent';
      undo.style.color = 'inherit';
      undo.style.borderRadius = '6px';
      undo.style.cursor = 'pointer';
      undo.onclick = () => { try{ onUndo(); }catch{} el.classList.remove('show'); setTimeout(()=>el.remove(), 250); };
      el.appendChild(undo);
    }
    document.body.appendChild(el);
    setTimeout(()=>el.classList.add('show'), 30);
    setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(), 250); }, 4500);
  }

  function injectStyles() {
    if (document.getElementById('search-filter-controller-styles')) return;
    const style = document.createElement('style');
    style.id = 'search-filter-controller-styles';
    style.textContent = `
      .dimmed { opacity: .35; filter: grayscale(.1); transition: opacity .2s ease; }
      .spotlight { outline: 2px solid #ffc107; box-shadow: 0 0 0 4px rgba(255,193,7,.25); border-radius: 6px; }
      .suggestions-panel { position: absolute; left: 0; right: 0; top: 100%; z-index: 20; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 6px; box-shadow: 0 10px 20px rgba(0,0,0,.08); max-height: 320px; overflow: auto; }
      .suggestions-item { padding: 10px 12px; cursor: pointer; }
      .suggestions-item:hover { background: #fafafa; }
    `;
    document.head.appendChild(style);
  }

  function bindUI() {
    injectStyles();
    const input = document.querySelector('.search-input');
    let timer = null;
    if (input) {
      input.addEventListener('input', (e) => {
        const val = e.target.value || '';
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.query = val;
          applyFilters();
        }, 150);
      });
    }

    // Bind date filter inputs
    // Advanced filters removed – no bindings needed

    const buttons = document.querySelectorAll('.filter-buttons .filter-btn');
    if (buttons.length) {
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const text = (btn.textContent || '').trim();
          const match = text.match(/(\d+)/);
          state.generationFilter = text.includes('Todas') ? null : (match ? parseInt(match[1], 10) : null);
          applyFilters();
        });
      });
    }



    // Suggestions panel under search input
    const wrapper = document.querySelector('.search-input-wrapper');
    if (wrapper && !state.suggestionsEl) {
      wrapper.style.position = 'relative';
      const panel = document.createElement('div');
      panel.className = 'suggestions-panel';
      panel.style.display = 'none';
      state.suggestionsEl = panel;
      wrapper.appendChild(panel);
    }
  }

  function init(members) {
    buildIndex(members || []);
    bindUI();
    applyFilters();
  }

  window.addEventListener('familyDataLoaded', (e) => {
    init(e.detail || []);
  });

  function showSuggestions(items) {
    if (!state.suggestionsEl) return;
    if (!items || items.length === 0) {
      state.suggestionsEl.style.display = 'none';
      state.suggestionsEl.innerHTML = '';
      return;
    }
    state.suggestionsEl.innerHTML = items.map(it => `
      <div class="suggestions-item" data-id="${it.id}">
        ${escapeHtml(it.name)}${it.generation ? ` <small>(G${it.generation})</small>` : ''}
        ${it.type === 'partner' ? ` <small>• cônjuge</small>` : ''}
      </div>
    `).join('');
    state.suggestionsEl.style.display = 'block';
    state.suggestionsEl.onclick = (e) => {
      const item = e.target.closest('.suggestions-item');
      if (!item) return;
      const id = item.getAttribute('data-id');
      const entry = items.find(x => x.id === id) || state.suggestionIndex.find(x => x.id === id);
      const m = state.members.find(mm => mm.id === id);
      if (entry && m) {
        // Check if person is hidden by current generation filter
        const cardEntry = state.cards.get(m.id);
        const isHiddenByFilter = cardEntry && cardEntry.el && cardEntry.el.style.display === 'none';
        
        // If hidden by generation filter, automatically clear it
        if (isHiddenByFilter && state.generationFilter !== null) {
          // Find and click the "Todas as gerações" button to clear filter
          const buttons = document.querySelectorAll('.filter-buttons .filter-btn');
          const allGenerationsButton = Array.from(buttons).find(b => 
            (b.textContent || '').includes('Todas')
          );
          if (allGenerationsButton) {
            allGenerationsButton.click();
          }
        }
        
        state.spotlightId = id;
        const input = document.querySelector('.search-input');
        if (input) input.value = entry.name;
        state.query = entry.name;
        hideSuggestions();
        
        // Small delay to ensure filter has been applied before spotlight
        setTimeout(() => {
          runSpotlight(m);
        }, 50);
      }
    };
  }

  function hideSuggestions() {
    if (state.suggestionsEl) {
      state.suggestionsEl.style.display = 'none';
      state.suggestionsEl.innerHTML = '';
    }
  }
})();


