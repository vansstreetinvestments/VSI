/**
 * VSI — Application Runtime (Minimalist Editorial Edition)
 * Zero neon glow, clean coordinate background, understated Quant CLI terminal, KaTeX typesetting.
 */
import { AvellanedaStoikovSim, HawkesProcessSim, OUSimulator, SABRBlackScholesSim, CardGraphsManager } from './simulators.js';

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. WEB AUDIO PROCEDURAL HAPTIC CLICKS (Soft Minimalist Click)
  // =========================================================================
  let audioCtx = null;
  let audioEnabled = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  window.playHaptic = function(freq = 400, duration = 0.02) {
    if (!audioEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context restricted
    }
  };

  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      initAudio();
      audioEnabled = !audioEnabled;
      audioToggleBtn.classList.toggle('text-white', audioEnabled);
      audioToggleBtn.classList.toggle('border-white/30', audioEnabled);
      const icon = audioToggleBtn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', audioEnabled ? 'volume-2' : 'volume-x');
        if (window.lucide) window.lucide.createIcons();
      }
      window.showToast(audioEnabled ? 'Audio Feedback Active' : 'Audio Feedback Muted');
      if (audioEnabled) window.playHaptic(440, 0.03);
    });
  }

  // =========================================================================
  // 2. SUBTLE MINIMALIST COORDINATE BACKGROUND (Zero Neon)
  // =========================================================================
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let bgW = (bgCanvas.width = window.innerWidth);
    let bgH = (bgCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      bgW = bgCanvas.width = window.innerWidth;
      bgH = bgCanvas.height = window.innerHeight;
      drawGrid();
    });

    function drawGrid() {
      bgCtx.clearRect(0, 0, bgW, bgH);
      bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      bgCtx.lineWidth = 1;
      const step = 48;
      for (let x = 0; x < bgW; x += step) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, bgH);
        bgCtx.stroke();
      }
      for (let y = 0; y < bgH; y += step) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(bgW, y);
        bgCtx.stroke();
      }

      // Small subtle coordinate crosshairs
      bgCtx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let x = step * 2; x < bgW; x += step * 4) {
        for (let y = step * 2; y < bgH; y += step * 4) {
          bgCtx.fillRect(x - 2, y, 5, 1);
          bgCtx.fillRect(x, y - 2, 1, 5);
        }
      }
    }
    drawGrid();
  }

  // =========================================================================
  // 3. KATEX MATHEMATICAL TYPESETTING
  // =========================================================================
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

  // =========================================================================
  // 4. SIMULATOR INITIALIZATION
  // =========================================================================
  let asSim = null;
  let hwkSim = null;
  let ouSim = null;
  let sabrSim = null;
  let cardGraphs = null;

  try {
    asSim = new AvellanedaStoikovSim('as-canvas');
    hwkSim = new HawkesProcessSim('hwk-canvas');
    ouSim = new OUSimulator('ou-canvas');
    sabrSim = new SABRBlackScholesSim('sabr-canvas');
    cardGraphs = new CardGraphsManager();
  } catch (err) {
    console.warn('Simulator initialization deferred:', err);
  }

  window.addEventListener('resize', () => {
    if (asSim) asSim.render();
    if (hwkSim) hwkSim.render();
    if (ouSim) ouSim.render();
    if (sabrSim) sabrSim.render();
    if (cardGraphs) cardGraphs.renderAll();
  });

  // =========================================================================
  // 5. UNDERSTATED QUANT CLI TERMINAL
  // =========================================================================
  const terminal = document.getElementById('quant-terminal');
  const terminalFab = document.getElementById('terminal-fab');
  const terminalClose = document.getElementById('terminal-close');
  const terminalInput = document.getElementById('terminal-input');
  const terminalBody = document.getElementById('terminal-body');

  function toggleTerminal() {
    if (!terminal) return;
    const isCollapsed = terminal.classList.contains('terminal-collapsed');
    if (isCollapsed) {
      terminal.classList.remove('terminal-collapsed');
      if (terminalFab) terminalFab.classList.add('hidden');
      if (terminalInput) terminalInput.focus();
    } else {
      terminal.classList.add('terminal-collapsed');
      if (terminalFab) terminalFab.classList.remove('hidden');
    }
  }

  if (terminalFab) terminalFab.addEventListener('click', toggleTerminal);
  if (terminalClose) terminalClose.addEventListener('click', toggleTerminal);

  document.addEventListener('keydown', (e) => {
    if (e.key === '`' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      toggleTerminal();
    }
  });

  function appendTerminal(html, isCommand = false) {
    if (!terminalBody) return;
    const line = document.createElement('div');
    if (isCommand) {
      line.className = 'text-white font-medium';
      line.innerHTML = `<span class="text-zinc-500 font-mono">vsi$</span> ${html}`;
    } else {
      line.className = 'text-zinc-400 font-mono text-xs';
      line.innerHTML = html;
    }
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';
        if (!cmd) return;

        appendTerminal(cmd, true);
        handleTerminalCommand(cmd);
      }
    });
  }

  function handleTerminalCommand(cmd) {
    const parts = cmd.split(' ');
    const root = parts[0];
    const arg = parts[1];

    switch (root) {
      case 'help':
        appendTerminal(`
Commands:
• <span class="text-white">help</span>: Show command index
• <span class="text-white">simulate &lt;as|hwk|ou|sabr&gt;</span>: Navigate and run model
• <span class="text-white">regime &lt;crisis|flash-crash|normal&gt;</span>: Calibrate multi-model stress state
• <span class="text-white">bibtex &lt;as|almgren|sabr|bouchaud&gt;</span>: Export academic citation
• <span class="text-white">clear</span>: Clear screen
        `);
        break;

      case 'clear':
        if (terminalBody) terminalBody.innerHTML = '';
        break;

      case 'simulate':
        if (arg === 'as' && asSim) {
          document.getElementById('simulators').scrollIntoView({ behavior: 'smooth' });
          asSim.render();
          appendTerminal('<span class="text-zinc-300">Active: Avellaneda-Stoikov Market Maker</span>');
        } else if (arg === 'hwk' && hwkSim) {
          document.getElementById('simulators').scrollIntoView({ behavior: 'smooth' });
          hwkSim.simulate();
          appendTerminal('<span class="text-zinc-300">Active: Hawkes Order Thinning Algorithm</span>');
        } else if (arg === 'ou' && ouSim) {
          document.getElementById('simulators').scrollIntoView({ behavior: 'smooth' });
          ouSim.simulate();
          appendTerminal('<span class="text-zinc-300">Active: Ornstein-Uhlenbeck Monte Carlo Path</span>');
        } else if (arg === 'sabr' && sabrSim) {
          document.getElementById('simulators').scrollIntoView({ behavior: 'smooth' });
          sabrSim.render();
          appendTerminal('<span class="text-zinc-300">Active: SABR Volatility Smile Calibration</span>');
        } else {
          appendTerminal('<span class="text-zinc-500">Usage: simulate &lt;as | hwk | ou | sabr&gt;</span>');
        }
        break;

      case 'regime':
        if (arg === 'crisis') {
          if (asSim) asSim.setPreset('inventory-shock');
          if (hwkSim) hwkSim.setPreset('flash-cascade');
          if (sabrSim) sabrSim.setPreset('equity-crash');
          appendTerminal('<span class="text-zinc-300">Regime: Crisis (Inventory Squeeze, High Branching Ratio, Negative Skew)</span>');
        } else if (arg === 'flash-crash') {
          if (hwkSim) hwkSim.setPreset('flash-cascade');
          if (ouSim) ouSim.setPreset('high-dispersion');
          appendTerminal('<span class="text-zinc-300">Regime: Flash Cascade (η=0.95, Elevated Dispersion)</span>');
        } else if (arg === 'normal') {
          if (asSim) asSim.setPreset('balanced');
          if (hwkSim) hwkSim.setPreset('subcritical');
          if (sabrSim) sabrSim.setPreset('fx-smile');
          appendTerminal('<span class="text-zinc-300">Regime: Normal (Balanced Inventory, Stationary Hawkes)</span>');
        } else {
          appendTerminal('<span class="text-zinc-500">Usage: regime &lt;crisis | flash-crash | normal&gt;</span>');
        }
        break;

      case 'bibtex':
        showBibtex(arg || 'general');
        break;

      default:
        appendTerminal(`<span class="text-zinc-500">Unrecognized command: "${cmd}". Type "help".</span>`);
    }
  }

  // =========================================================================
  // 6. BIBTEX CITATIONS
  // =========================================================================
  const bibtexEntries = {
    as: `@article{avellaneda2008high,
  title={High-frequency trading in a limit order book},
  author={Avellaneda, Marco and Stoikov, Sasha},
  journal={Quantitative Finance},
  volume={8},
  number={3},
  pages={217--224},
  year={2008}
}`,
    almgren: `@article{almgren2000optimal,
  title={Optimal execution of portfolio transactions},
  author={Almgren, Robert and Chriss, Neil},
  journal={Journal of Risk},
  volume={3},
  pages={5--40},
  year={2000}
}`,
    sabr: `@article{hagan2002managing,
  title={Managing smile risk},
  author={Hagan, Patrick S and Kumar, Deep and Lesniewski, Andrew S and Woodward, Diana E},
  journal={Wilmott Magazine},
  pages={84--108},
  year={2002}
}`,
    bouchaud: `@article{bouchaud2004fluctuations,
  title={Fluctuations and response in financial markets},
  author={Bouchaud, Jean-Philippe and Gefen, Yuval and Potters, Marc and Wyart, Matthieu},
  journal={Quantitative Finance},
  volume={4},
  number={2},
  pages={176--185},
  year={2004}
}`,
    general: `@techreport{vsi2026foundations,
  title={Mathematical Foundations of High-Frequency Trading and Stochastic Market Microstructure},
  author={{VSI Institute for Stochastic Intelligence}},
  institution={VSI Quantitative Research Working Paper Series},
  number={WP-2026-01},
  year={2026}
}`
  };

  function showBibtex(key) {
    const entry = bibtexEntries[key] || bibtexEntries.general;
    appendTerminal(`<pre class="text-[10px] text-zinc-300 bg-zinc-900/80 p-2 rounded">${entry}</pre>`);
    navigator.clipboard.writeText(entry).then(() => {
      window.showToast('BibTeX Copied');
    });
  }

  document.querySelectorAll('[data-bibtex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showBibtex(btn.dataset.bibtex);
    });
  });

  // =========================================================================
  // 7. SEARCH & CATEGORY FILTERING ENGINE
  // =========================================================================
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

    if (cardGraphs) {
      setTimeout(() => cardGraphs.renderAll(), 60);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterCards);
  }

  categoryFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach((b) => b.classList.remove('active', 'bg-white/10', 'text-white', 'border-white/20'));
      btn.classList.add('active', 'bg-white/10', 'text-white', 'border-white/20');
      activeCategory = btn.dataset.category;
      filterCards();
      if (window.playHaptic) window.playHaptic(420, 0.02);
    });
  });

  // =========================================================================
  // 8. EQUATION CLIPBOARD & TOAST
  // =========================================================================
  document.querySelectorAll('.copy-math-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.math-block');
      const mathRaw = btn.dataset.latex || (parent ? parent.dataset.latex : '');
      if (mathRaw) {
        navigator.clipboard.writeText(mathRaw).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Copied';
          btn.style.color = '#ffffff';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
          }, 1500);
          window.showToast('LaTeX copied');
          if (window.playHaptic) window.playHaptic(500, 0.02);
        });
      }
    });
  });

  window.showToast = function(msg) {
    let toast = document.getElementById('vsi-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vsi-toast';
      toast.className = 'fixed bottom-6 left-6 bg-zinc-900 border border-zinc-700 text-zinc-200 px-3.5 py-2 rounded text-xs font-mono z-50 transition-opacity duration-200 pointer-events-none';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 1800);
  };

  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileBtn && mobileNav) {
    mobileBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('hidden');
    });
  }
});
