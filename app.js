/**
 * VSI — Application Runtime
 * Manages KaTeX auto-rendering, tabs, search/filter engine, equation clipboard, and simulators.
 */
import { AvellanedaStoikovSim, HawkesProcessSim, OUSimulator, SABRBlackScholesSim } from './simulators.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize KaTeX Auto-Render
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    });
  }

  // 2. Initialize Interactive Simulators
  let asSim = null;
  let hwkSim = null;
  let ouSim = null;
  let sabrSim = null;

  try {
    asSim = new AvellanedaStoikovSim('as-canvas');
    hwkSim = new HawkesProcessSim('hwk-canvas');
    ouSim = new OUSimulator('ou-canvas');
    sabrSim = new SABRBlackScholesSim('sabr-canvas');
  } catch (err) {
    console.warn('Simulator initialization deferred:', err);
  }

  // Handle Canvas Resize on window change
  window.addEventListener('resize', () => {
    ['as-canvas', 'hwk-canvas', 'ou-canvas', 'sabr-canvas'].forEach((id) => {
      const c = document.getElementById(id);
      if (c && c.parentElement) {
        c.width = c.parentElement.clientWidth;
      }
    });
    if (asSim) asSim.render();
    if (hwkSim) hwkSim.render();
    if (ouSim) ouSim.render();
    if (sabrSim) sabrSim.render();
  });

  // Trigger initial resize
  window.dispatchEvent(new Event('resize'));

  // 3. Search & Filter Engine
  const searchInput = document.getElementById('search-input');
  const categoryFilters = document.querySelectorAll('.category-filter-btn');
  const modelCards = document.querySelectorAll('.quant-model-card');
  const countBadge = document.getElementById('visible-models-count');

  let activeCategory = 'all';

  function filterCards() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    modelCards.forEach((card) => {
      const category = card.dataset.category || '';
      const text = card.textContent.toLowerCase();
      const tags = card.dataset.tags ? card.dataset.tags.toLowerCase() : '';

      const matchesCat = activeCategory === 'all' || category === activeCategory;
      const matchesSearch = query === '' || text.includes(query) || tags.includes(query);

      if (matchesCat && matchesSearch) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (countBadge) {
      countBadge.textContent = `${visibleCount} Models Active`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterCards);
  }

  categoryFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach((b) => b.classList.remove('active', 'bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40'));
      btn.classList.add('active', 'bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40');
      activeCategory = btn.dataset.category;
      filterCards();
    });
  });

  // 4. Copy Equation to Clipboard
  document.querySelectorAll('.copy-math-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const parent = btn.closest('.math-block');
      const mathRaw = btn.dataset.latex || (parent ? parent.dataset.latex : '');
      if (mathRaw) {
        navigator.clipboard.writeText(mathRaw).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.color = '#10b981';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
          }, 1800);
        });
      }
    });
  });

  // 5. Toast Notification System
  window.showToast = function(msg) {
    let toast = document.getElementById('vsi-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vsi-toast';
      toast.className = 'fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-lg shadow-2xl text-xs font-mono z-50 transition-opacity duration-300';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2500);
  };

  // 6. Mobile Nav Toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('hidden');
    });
  }
});
