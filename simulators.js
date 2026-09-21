/**
 * VSI — Premium Minimalist Quantitative Finance & HFT Simulators
 * Zero neon glow, publication-grade line precision, Retina HiDPI scaling.
 */

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function setupHiDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.parentElement.clientWidth || 600;
  const h = rect.height || 310;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);
  return { width: w, height: h };
}

/* =========================================================================
   1. AVELLANEDA-STOIKOV MARKET MAKING SIMULATOR
   ========================================================================= */
export class AvellanedaStoikovSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.wrap = this.canvas.parentElement;
    this.tooltip = this.wrap.querySelector('.sim-tooltip');
    this.params = {
      s0: 100.0,
      q: 2,
      gamma: 0.1,
      sigma: 0.30,
      T_minus_t: 1.0,
      kappa: 1.5
    };
    this.mousePos = null;
    this.initControls();
    this.initMouse();
    this.render();
  }

  initControls() {
    const bind = (id, key, formatFn) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(`${id}-val`);
      if (!el) return;
      el.addEventListener('input', (e) => {
        this.params[key] = parseFloat(e.target.value);
        if (valEl) valEl.textContent = formatFn ? formatFn(this.params[key]) : this.params[key];
        this.render();
      });
    };

    bind('as-q', 'q', (v) => (v > 0 ? `+${v}` : `${v}`));
    bind('as-gamma', 'gamma', (v) => v.toFixed(2));
    bind('as-sigma', 'sigma', (v) => (v * 100).toFixed(0) + '%');
    bind('as-kappa', 'kappa', (v) => v.toFixed(1));
    bind('as-time', 'T_minus_t', (v) => v.toFixed(2));

    document.querySelectorAll('[data-as-preset]').forEach((btn) => {
      btn.addEventListener('click', () => this.setPreset(btn.dataset.asPreset));
    });
  }

  setPreset(name) {
    if (name === 'inventory-shock') {
      this.setValues({ q: 7, gamma: 0.25, sigma: 0.45 });
    } else if (name === 'balanced') {
      this.setValues({ q: 0, gamma: 0.10, sigma: 0.30 });
    } else if (name === 'high-vol') {
      this.setValues({ q: 3, gamma: 0.15, sigma: 0.70 });
    }
  }

  setValues(newVals) {
    Object.assign(this.params, newVals);
    for (const [k, v] of Object.entries(newVals)) {
      const input = document.getElementById(`as-${k}`);
      const valEl = document.getElementById(`as-${k}-val`);
      if (input) input.value = v;
      if (valEl) {
        if (k === 'q') valEl.textContent = v > 0 ? `+${v}` : `${v}`;
        else if (k === 'sigma') valEl.textContent = `${(v * 100).toFixed(0)}%`;
        else valEl.textContent = v.toFixed(2);
      }
    }
    this.render();
    if (window.playHaptic) window.playHaptic(350, 0.03);
  }

  initMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.render();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mousePos = null;
      if (this.tooltip) this.tooltip.style.opacity = '0';
      this.render();
    });
  }

  calculate() {
    const { s0, q, gamma, sigma, T_minus_t, kappa } = this.params;
    const reservationPrice = s0 - (q * gamma * Math.pow(sigma, 2) * T_minus_t * 100);
    const halfSpread = (1 / gamma) * Math.log(1 + (gamma / kappa));
    const deltaA = (s0 - reservationPrice) + halfSpread;
    const deltaB = (reservationPrice - s0) + halfSpread;
    const askQuote = s0 + Math.max(0.1, deltaA);
    const bidQuote = s0 - Math.max(0.1, deltaB);
    const totalSpread = askQuote - bidQuote;

    return { s0, reservationPrice, bidQuote, askQuote, deltaA, deltaB, totalSpread };
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = setupHiDPI(this.canvas, this.ctx);
    const ctx = this.ctx;
    const res = this.calculate();

    ctx.clearRect(0, 0, width, height);

    // Minimal Subtle Coordinate Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 25; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const centerPrice = res.s0;
    const priceRange = 8.0;
    const priceToY = (p) => {
      const norm = (centerPrice + priceRange / 2 - p) / priceRange;
      return Math.max(30, Math.min(height - 40, norm * height));
    };

    const midY = priceToY(res.s0);
    const resY = priceToY(res.reservationPrice);
    const askY = priceToY(res.askQuote);
    const bidY = priceToY(res.bidQuote);

    // Spread Band (Subtle Minimalist Fill)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(70, askY, width - 200, bidY - askY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(70, askY, width - 200, bidY - askY);

    // Mid Price (Dashed Muted Line)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, midY);
    ctx.lineTo(width - 110, midY);
    ctx.stroke();

    // Reservation Price (Subdued Clean Blue)
    ctx.setLineDash([]);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, resY);
    ctx.lineTo(width - 110, resY);
    ctx.stroke();

    // Ask Quote Line (Muted Warm Red)
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, askY);
    ctx.lineTo(width - 110, askY);
    ctx.stroke();

    // Bid Quote Line (Muted Sage Green)
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, bidY);
    ctx.lineTo(width - 110, bidY);
    ctx.stroke();

    // Typography
    ctx.font = '10.5px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'right';
    ctx.fillText(`Mid $${res.s0.toFixed(2)}`, 45, midY + 3);

    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`r(s,q) $${res.reservationPrice.toFixed(2)}`, 45, resY + 3);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f87171';
    ctx.fillText(`Ask: $${res.askQuote.toFixed(2)}`, width - 100, askY + 3);

    ctx.fillStyle = '#6ee7b7';
    ctx.fillText(`Bid: $${res.bidQuote.toFixed(2)}`, width - 100, bidY + 3);

    // Status Pill
    ctx.font = '500 11.5px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(`Inventory: q = ${this.params.q > 0 ? '+' : ''}${this.params.q}`, 20, 20);

    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = '#a1a1aa';
    const tiltText = this.params.q > 0 
      ? `• Long position: Quotes skewed lower to accelerate liquidation` 
      : (this.params.q < 0 ? `• Short position: Quotes skewed higher to attract buys` : `• Neutral: Balanced spreads`);
    ctx.fillText(tiltText, 140, 20);

    // Crosshair
    if (this.mousePos) {
      const mx = this.mousePos.x;
      const my = this.mousePos.y;
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, 0);
      ctx.lineTo(mx, height);
      ctx.moveTo(0, my);
      ctx.lineTo(width, my);
      ctx.stroke();
      ctx.setLineDash([]);

      const inspectPrice = (centerPrice + priceRange / 2 - (my / height) * priceRange);
      if (this.tooltip) {
        this.tooltip.style.opacity = '1';
        this.tooltip.style.left = `${Math.min(width - 130, mx + 10)}px`;
        this.tooltip.style.top = `${Math.max(10, my - 22)}px`;
        this.tooltip.textContent = `$${inspectPrice.toFixed(2)}`;
      }
    }
  }
}

/* =========================================================================
   2. HAWKES PROCESS SIMULATOR (Self-Exciting Point Process)
   ========================================================================= */
export class HawkesProcessSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.wrap = this.canvas.parentElement;
    this.tooltip = this.wrap.querySelector('.sim-tooltip');
    this.params = {
      mu: 1.2,
      alpha: 1.6,
      beta: 2.0,
      T: 10.0
    };
    this.events = [];
    this.mousePos = null;
    this.initControls();
    this.initMouse();
    this.simulate();
  }

  initControls() {
    const bind = (id, key, formatFn) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(`${id}-val`);
      if (!el) return;
      el.addEventListener('input', (e) => {
        this.params[key] = parseFloat(e.target.value);
        if (valEl) valEl.textContent = formatFn ? formatFn(this.params[key]) : this.params[key];
        this.simulate();
      });
    };

    bind('hwk-mu', 'mu', (v) => v.toFixed(1));
    bind('hwk-alpha', 'alpha', (v) => v.toFixed(1));
    bind('hwk-beta', 'beta', (v) => v.toFixed(1));

    const regenBtn = document.getElementById('hwk-regen-btn');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => {
        this.simulate();
        if (window.playHaptic) window.playHaptic(350, 0.03);
      });
    }

    document.querySelectorAll('[data-hwk-preset]').forEach((btn) => {
      btn.addEventListener('click', () => this.setPreset(btn.dataset.hwkPreset));
    });
  }

  setPreset(name) {
    if (name === 'flash-cascade') {
      this.setValues({ mu: 1.0, alpha: 2.85, beta: 3.0 });
    } else if (name === 'subcritical') {
      this.setValues({ mu: 1.2, alpha: 1.2, beta: 2.4 });
    } else if (name === 'poisson') {
      this.setValues({ mu: 2.5, alpha: 0.1, beta: 4.0 });
    }
  }

  setValues(newVals) {
    Object.assign(this.params, newVals);
    for (const [k, v] of Object.entries(newVals)) {
      const input = document.getElementById(`hwk-${k}`);
      const valEl = document.getElementById(`hwk-${k}-val`);
      if (input) input.value = v;
      if (valEl) valEl.textContent = v.toFixed(1);
    }
    this.simulate();
    if (window.playHaptic) window.playHaptic(350, 0.03);
  }

  initMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.render();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mousePos = null;
      if (this.tooltip) this.tooltip.style.opacity = '0';
      this.render();
    });
  }

  simulate() {
    const { mu, alpha, beta, T } = this.params;
    this.events = [];
    let t = 0;
    let lambdaStar = mu;

    while (t < T) {
      const u1 = Math.random();
      const s = -Math.log(u1) / lambdaStar;
      t += s;
      if (t >= T) break;

      let currentLambda = mu;
      for (const ti of this.events) {
        currentLambda += alpha * Math.exp(-beta * (t - ti));
      }

      const u2 = Math.random();
      if (u2 <= currentLambda / lambdaStar) {
        this.events.push(t);
        lambdaStar = currentLambda + alpha;
      } else {
        lambdaStar = currentLambda;
      }
    }
    this.render();
  }

  intensityAt(t) {
    const { mu, alpha, beta } = this.params;
    let val = mu;
    for (const ti of this.events) {
      if (ti > t) break;
      val += alpha * Math.exp(-beta * (t - ti));
    }
    return val;
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = setupHiDPI(this.canvas, this.ctx);
    const ctx = this.ctx;
    const { mu, alpha, beta, T } = this.params;
    const branchingRatio = (alpha / beta).toFixed(2);

    ctx.clearRect(0, 0, width, height);

    let maxLambda = mu * 2.8;
    const numPoints = 260;
    const dt = T / numPoints;
    const lambdaSeries = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i * dt;
      const lam = this.intensityAt(t);
      lambdaSeries.push({ t, lam });
      if (lam > maxLambda) maxLambda = lam;
    }
    maxLambda *= 1.15;

    const padL = 40, padR = 20, padT = 30, padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tToX = (t) => padL + (t / T) * plotW;
    const lamToY = (l) => padT + plotH - (l / maxLambda) * plotH;

    // Baseline intensity
    const baseLineY = lamToY(mu);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, baseLineY);
    ctx.lineTo(padL + plotW, baseLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill under intensity curve
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    for (let i = 0; i < lambdaSeries.length; i++) {
      const pt = lambdaSeries[i];
      ctx.lineTo(tToX(pt.t), lamToY(pt.lam));
    }
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(228, 228, 231, 0.04)';
    ctx.fill();

    // Intensity Curve (Clean Crisp Platinum)
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < lambdaSeries.length; i++) {
      const pt = lambdaSeries[i];
      const x = tToX(pt.t);
      const y = lamToY(pt.lam);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Arrival event dots
    for (const tEvent of this.events) {
      const x = tToX(tEvent);
      const lamEvent = this.intensityAt(tEvent);
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.arc(x, lamToY(lamEvent), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axes
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxLambda.toFixed(1)} λ`, padL - 6, padT + 8);
    ctx.fillText(`${mu.toFixed(1)} μ`, padL - 6, baseLineY + 3);

    ctx.textAlign = 'center';
    ctx.fillText('0s', padL, height - 10);
    ctx.fillText(`${(T / 2).toFixed(0)}s`, padL + plotW / 2, height - 10);
    ctx.fillText(`${T.toFixed(0)}s`, padL + plotW, height - 10);

    // Metrics
    ctx.font = '500 11.5px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(`Events: ${this.events.length}`, padL, 18);

    const isStationary = alpha < beta;
    ctx.fillStyle = isStationary ? '#a1a1aa' : '#f87171';
    ctx.textAlign = 'right';
    ctx.fillText(`Branching Ratio η = ${branchingRatio} ${isStationary ? '(Stationary)' : '(Explosive)'}`, width - padR, 18);

    // Tooltip
    if (this.mousePos) {
      const mx = this.mousePos.x;
      if (mx >= padL && mx <= padL + plotW) {
        const hoverT = ((mx - padL) / plotW) * T;
        const hoverLam = this.intensityAt(hoverT);
        const my = lamToY(hoverLam);

        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(mx, padT);
        ctx.lineTo(mx, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();

        if (this.tooltip) {
          this.tooltip.style.opacity = '1';
          this.tooltip.style.left = `${Math.min(width - 130, mx + 10)}px`;
          this.tooltip.style.top = `${Math.max(10, my - 22)}px`;
          this.tooltip.textContent = `t=${hoverT.toFixed(1)}s | λ=${hoverLam.toFixed(1)}`;
        }
      }
    }
  }
}

/* =========================================================================
   3. ORNSTEIN-UHLENBECK (OU) MEAN REVERSION SDE SIMULATOR
   ========================================================================= */
export class OUSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.wrap = this.canvas.parentElement;
    this.tooltip = this.wrap.querySelector('.sim-tooltip');
    this.params = {
      theta: 1.5,
      mu: 0.0,
      sigma: 0.4,
      x0: 1.2,
      T: 5.0,
      numPaths: 4
    };
    this.paths = [];
    this.mousePos = null;
    this.initControls();
    this.initMouse();
    this.simulate();
  }

  initControls() {
    const bind = (id, key, formatFn) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(`${id}-val`);
      if (!el) return;
      el.addEventListener('input', (e) => {
        this.params[key] = parseFloat(e.target.value);
        if (valEl) valEl.textContent = formatFn ? formatFn(this.params[key]) : this.params[key];
        this.simulate();
      });
    };

    bind('ou-theta', 'theta', (v) => v.toFixed(2));
    bind('ou-mu', 'mu', (v) => v.toFixed(2));
    bind('ou-sigma', 'sigma', (v) => v.toFixed(2));
    bind('ou-x0', 'x0', (v) => v.toFixed(2));

    const regenBtn = document.getElementById('ou-regen-btn');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => {
        this.simulate();
        if (window.playHaptic) window.playHaptic(350, 0.03);
      });
    }

    document.querySelectorAll('[data-ou-preset]').forEach((btn) => {
      btn.addEventListener('click', () => this.setPreset(btn.dataset.ouPreset));
    });
  }

  setPreset(name) {
    if (name === 'fast-revert') {
      this.setValues({ theta: 3.5, mu: 0.0, sigma: 0.45, x0: 1.5 });
    } else if (name === 'slow-drift') {
      this.setValues({ theta: 0.3, mu: 0.0, sigma: 0.30, x0: 1.0 });
    } else if (name === 'high-dispersion') {
      this.setValues({ theta: 1.2, mu: 0.0, sigma: 0.85, x0: 0.2 });
    }
  }

  setValues(newVals) {
    Object.assign(this.params, newVals);
    for (const [k, v] of Object.entries(newVals)) {
      const input = document.getElementById(`ou-${k}`);
      const valEl = document.getElementById(`ou-${k}-val`);
      if (input) input.value = v;
      if (valEl) valEl.textContent = v.toFixed(2);
    }
    this.simulate();
    if (window.playHaptic) window.playHaptic(350, 0.03);
  }

  initMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.render();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mousePos = null;
      if (this.tooltip) this.tooltip.style.opacity = '0';
      this.render();
    });
  }

  simulate() {
    const { theta, mu, sigma, x0, T, numPaths } = this.params;
    const steps = 250;
    const dt = T / steps;
    this.paths = [];

    const decay = Math.exp(-theta * dt);
    const condVar = (Math.pow(sigma, 2) / (2 * theta)) * (1 - Math.exp(-2 * theta * dt));
    const condStd = Math.sqrt(Math.max(1e-8, condVar));

    for (let p = 0; p < numPaths; p++) {
      const path = [{ t: 0, x: x0 }];
      let currentX = x0;

      for (let i = 1; i <= steps; i++) {
        const t = i * dt;
        const eps = randn();
        currentX = currentX * decay + mu * (1 - decay) + condStd * eps;
        path.push({ t, x: currentX });
      }
      this.paths.push(path);
    }
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = setupHiDPI(this.canvas, this.ctx);
    const ctx = this.ctx;
    const { theta, mu, sigma, T } = this.params;

    ctx.clearRect(0, 0, width, height);

    const statStd = sigma / Math.sqrt(2 * theta);
    const halfLife = Math.log(2) / theta;

    const padL = 40, padR = 20, padT = 30, padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const yMin = mu - 3.2 * statStd;
    const yMax = mu + 3.2 * statStd;

    const tToX = (t) => padL + (t / T) * plotW;
    const xToY = (x) => padT + plotH - ((x - yMin) / (yMax - yMin)) * plotH;

    // Stationary Confidence Bands (Subtle Greyscale)
    const band2Top = xToY(mu + 2 * statStd);
    const band2Bottom = xToY(mu - 2 * statStd);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(padL, band2Top, plotW, band2Bottom - band2Top);

    const band1Top = xToY(mu + statStd);
    const band1Bottom = xToY(mu - statStd);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(padL, band1Top, plotW, band1Bottom - band1Top);

    // Mean Line (μ)
    const muY = xToY(mu);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, muY);
    ctx.lineTo(padL + plotW, muY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Publication-grade clean path colors (Zero neon)
    const pathColors = ['#e4e4e7', '#93c5fd', '#a1a1aa', '#cbd5e1'];

    for (let p = 0; p < this.paths.length; p++) {
      const path = this.paths[p];
      ctx.strokeStyle = pathColors[p % pathColors.length];
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const x = tToX(path[i].t);
        const y = xToY(path[i].x);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axes
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'right';
    ctx.fillText(`+2σ`, padL - 6, band2Top + 3);
    ctx.fillText(`μ`, padL - 6, muY + 3);
    ctx.fillText(`-2σ`, padL - 6, band2Bottom + 3);

    ctx.textAlign = 'center';
    ctx.fillText('0s', padL, height - 10);
    ctx.fillText(`${(T / 2).toFixed(1)}s`, padL + plotW / 2, height - 10);
    ctx.fillText(`${T.toFixed(1)}s`, padL + plotW, height - 10);

    // Header
    ctx.font = '500 11.5px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(`Half-Life τ₁/₂: ${halfLife.toFixed(2)}s`, padL, 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`Stationary σ_∞: ${statStd.toFixed(3)}`, width - padR, 18);

    // Tooltip
    if (this.mousePos) {
      const mx = this.mousePos.x;
      if (mx >= padL && mx <= padL + plotW) {
        const hoverT = ((mx - padL) / plotW) * T;
        const my = this.mousePos.y;
        const hoverX = yMin + ((padT + plotH - my) / plotH) * (yMax - yMin);

        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(mx, padT);
        ctx.lineTo(mx, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        if (this.tooltip) {
          this.tooltip.style.opacity = '1';
          this.tooltip.style.left = `${Math.min(width - 130, mx + 10)}px`;
          this.tooltip.style.top = `${Math.max(10, my - 22)}px`;
          this.tooltip.textContent = `t=${hoverT.toFixed(1)}s | X=${hoverX.toFixed(2)}`;
        }
      }
    }
  }
}

/* =========================================================================
   4. BLACK-SCHOLES & SABR VOLATILITY SMILE SIMULATOR
   ========================================================================= */
export class SABRBlackScholesSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.wrap = this.canvas.parentElement;
    this.tooltip = this.wrap.querySelector('.sim-tooltip');
    this.params = {
      f: 100.0,
      T: 1.0,
      alpha: 0.25,
      beta: 0.8,
      rho: -0.35,
      nu: 0.40
    };
    this.mousePos = null;
    this.initControls();
    this.initMouse();
    this.render();
  }

  initControls() {
    const bind = (id, key, formatFn) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(`${id}-val`);
      if (!el) return;
      el.addEventListener('input', (e) => {
        this.params[key] = parseFloat(e.target.value);
        if (valEl) valEl.textContent = formatFn ? formatFn(this.params[key]) : this.params[key];
        this.render();
      });
    };

    bind('sabr-alpha', 'alpha', (v) => (v * 100).toFixed(0) + '%');
    bind('sabr-beta', 'beta', (v) => v.toFixed(2));
    bind('sabr-rho', 'rho', (v) => v.toFixed(2));
    bind('sabr-nu', 'nu', (v) => (v * 100).toFixed(0) + '%');

    document.querySelectorAll('[data-sabr-preset]').forEach((btn) => {
      btn.addEventListener('click', () => this.setPreset(btn.dataset.sabrPreset));
    });
  }

  setPreset(name) {
    if (name === 'equity-crash') {
      this.setValues({ rho: -0.75, nu: 0.55, alpha: 0.25, beta: 0.7 });
    } else if (name === 'fx-smile') {
      this.setValues({ rho: 0.0, nu: 0.50, alpha: 0.20, beta: 1.0 });
    } else if (name === 'vol-explosion') {
      this.setValues({ rho: -0.40, nu: 0.85, alpha: 0.40, beta: 0.6 });
    }
  }

  setValues(newVals) {
    Object.assign(this.params, newVals);
    for (const [k, v] of Object.entries(newVals)) {
      const input = document.getElementById(`sabr-${k}`);
      const valEl = document.getElementById(`sabr-${k}-val`);
      if (input) input.value = v;
      if (valEl) {
        if (k === 'alpha' || k === 'nu') valEl.textContent = `${(v * 100).toFixed(0)}%`;
        else valEl.textContent = v.toFixed(2);
      }
    }
    this.render();
    if (window.playHaptic) window.playHaptic(350, 0.03);
  }

  initMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.render();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mousePos = null;
      if (this.tooltip) this.tooltip.style.opacity = '0';
      this.render();
    });
  }

  calculateSABR(K) {
    const { f, T, alpha, beta, rho, nu } = this.params;
    if (Math.abs(f - K) < 1e-4) {
      const fMid = Math.pow(f, 1 - beta);
      const term1 = alpha / fMid;
      const term2 = 1 + (Math.pow(1 - beta, 2) / 24 * Math.pow(alpha, 2) / Math.pow(f, 2 - 2 * beta) +
        (rho * beta * nu * alpha) / (4 * fMid) +
        (2 - 3 * Math.pow(rho, 2)) / 24 * Math.pow(nu, 2)) * T;
      return term1 * term2;
    }

    const logFK = Math.log(f / K);
    const fK_pow = Math.pow(f * K, (1 - beta) / 2);
    const z = (nu / alpha) * fK_pow * logFK;
    const xz = Math.log((Math.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho));

    const num = alpha * (1 + (Math.pow(1 - beta, 2) / 24 * Math.pow(alpha, 2) / Math.pow(f * K, 1 - beta) +
      (rho * beta * nu * alpha) / (4 * fK_pow) +
      (2 - 3 * Math.pow(rho, 2)) / 24 * Math.pow(nu, 2)) * T);

    const denom = fK_pow * (1 + Math.pow(1 - beta, 2) / 24 * Math.pow(logFK, 2) + Math.pow(1 - beta, 4) / 1920 * Math.pow(logFK, 4));

    return (num / denom) * (z / xz);
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = setupHiDPI(this.canvas, this.ctx);
    const ctx = this.ctx;
    const { f, rho } = this.params;

    ctx.clearRect(0, 0, width, height);

    const strikes = [];
    const vols = [];
    const minK = 70, maxK = 130;
    const steps = 120;
    let minVol = 1.0, maxVol = 0.0;

    for (let i = 0; i <= steps; i++) {
      const K = minK + (i / steps) * (maxK - minK);
      const vol = this.calculateSABR(K);
      strikes.push(K);
      vols.push(vol);
      if (vol < minVol) minVol = vol;
      if (vol > maxVol) maxVol = vol;
    }

    minVol = Math.max(0.05, minVol * 0.85);
    maxVol = maxVol * 1.15;

    const padL = 40, padR = 20, padT = 30, padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const kToX = (K) => padL + ((K - minK) / (maxK - minK)) * plotW;
    const vToY = (v) => padT + plotH - ((v - minVol) / (maxVol - minVol)) * plotH;

    // ATM Marker
    const atmX = kToX(f);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(atmX, padT);
    ctx.lineTo(atmX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill under curve
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    for (let i = 0; i < strikes.length; i++) {
      ctx.lineTo(kToX(strikes[i]), vToY(vols[i]));
    }
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();

    // SABR Smile Curve (Clean White)
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < strikes.length; i++) {
      const x = kToX(strikes[i]);
      const y = vToY(vols[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Axes
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'right';
    ctx.fillText(`${(maxVol * 100).toFixed(0)}%`, padL - 6, padT + 8);
    ctx.fillText(`${(minVol * 100).toFixed(0)}%`, padL - 6, padT + plotH);

    ctx.textAlign = 'center';
    ctx.fillText(`${minK}`, padL, height - 10);
    ctx.fillText(`K=${f.toFixed(0)} (ATM)`, atmX, height - 10);
    ctx.fillText(`${maxK}`, padL + plotW, height - 10);

    // Header Info
    ctx.font = '500 11.5px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(`SABR Volatility Smile`, padL, 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#a1a1aa';
    const skewType = rho < -0.1 ? 'Negative Skew' : (rho > 0.1 ? 'Positive Skew' : 'Symmetric');
    ctx.fillText(`ρ = ${rho.toFixed(2)} (${skewType})`, width - padR, 18);

    // Tooltip
    if (this.mousePos) {
      const mx = this.mousePos.x;
      if (mx >= padL && mx <= padL + plotW) {
        const hoverK = minK + ((mx - padL) / plotW) * (maxK - minK);
        const hoverVol = this.calculateSABR(hoverK);
        const my = vToY(hoverVol);

        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(mx, padT);
        ctx.lineTo(mx, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();

        if (this.tooltip) {
          this.tooltip.style.opacity = '1';
          this.tooltip.style.left = `${Math.min(width - 130, mx + 10)}px`;
          this.tooltip.style.top = `${Math.max(10, my - 22)}px`;
          this.tooltip.textContent = `K=${hoverK.toFixed(1)} | IV=${(hoverVol * 100).toFixed(1)}%`;
        }
      }
    }
  }
}

/* =========================================================================
   5. CARD EMBEDDED MINI-GRAPHS (Academic Function Visualizers)
   ========================================================================= */
export class CardGraphsManager {
  constructor() {
    this.renderAll();
  }

  renderAll() {
    this.renderMicropriceGraph();
    this.renderBouchaudGraph();
    this.renderAlmgrenGraph();
    this.renderKalmanGraph();
    this.renderEVTGraph();
    this.renderDupireGraph();
  }

  setupCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.parentElement.clientWidth || 300;
    const h = rect.height || 140;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    return { canvas, ctx, width: w, height: h };
  }

  // 1. Stoikov Microprice vs Queue Imbalance
  renderMicropriceGraph() {
    const s = this.setupCanvas('graph-microprice');
    if (!s) return;
    const { ctx, width, height } = s;

    ctx.clearRect(0, 0, width, height);
    const padL = 35, padR = 15, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Zero axes
    const midY = padT + plotH / 2;
    const midX = padL + plotW / 2;
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(padL, midY);
    ctx.lineTo(padL + plotW, midY);
    ctx.moveTo(midX, padT);
    ctx.lineTo(midX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve: P_micro - P_mid = S/2 * I_Q
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const iq = -1 + (i / 60) * 2; // -1 to +1
      const x = padL + ((iq + 1) / 2) * plotW;
      const dp = 0.5 * Math.tanh(iq * 1.5); // non-linear saturated curve
      const y = midY - (dp / 0.6) * (plotH / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Linear reference
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(padL, midY + (plotH / 2) * 0.8);
    ctx.lineTo(padL + plotW, midY - (plotH / 2) * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Queue Imbalance I_Q (-1 to +1)', midX, height - 6);
    ctx.textAlign = 'right';
    ctx.fillText('+S/2', padL - 4, padT + 8);
    ctx.fillText('-S/2', padL - 4, padT + plotH);
  }

  // 2. Bouchaud Market Impact Propagator Decay G(tau) ~ tau^-gamma
  renderBouchaudGraph() {
    const s = this.setupCanvas('graph-bouchaud');
    if (!s) return;
    const { ctx, width, height } = s;

    ctx.clearRect(0, 0, width, height);
    const padL = 35, padR = 15, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Power-law decay: G(tau) = 1 / (1 + tau)^0.5
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const tau = (i / 60) * 10;
      const g = 1 / Math.pow(1 + tau, 0.5);
      const x = padL + (i / 60) * plotW;
      const y = padT + plotH - g * plotH * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Exponential benchmark (faster decay)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const tau = (i / 60) * 10;
      const gExp = Math.exp(-0.8 * tau);
      const x = padL + (i / 60) * plotW;
      const y = padT + plotH - gExp * plotH * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Lag τ (Trades Elapsed)', padL + plotW / 2, height - 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText('G(τ) ~ τ⁻⁰·⁵ (Power-Law Memory)', padL + 6, padT + 12);
  }

  // 3. Almgren-Chriss Liquidation Trajectories
  renderAlmgrenGraph() {
    const s = this.setupCanvas('graph-almgren');
    if (!s) return;
    const { ctx, width, height } = s;

    ctx.clearRect(0, 0, width, height);
    const padL = 35, padR = 15, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const T = 1.0;
    const kappas = [3.5, 1.5, 0.2];
    const colors = ['#f87171', '#93c5fd', '#a1a1aa'];

    kappas.forEach((kappa, idx) => {
      ctx.strokeStyle = colors[idx];
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const t = (i / 50) * T;
        const traj = Math.sinh(kappa * (T - t)) / Math.sinh(kappa * T);
        const x = padL + (t / T) * plotW;
        const y = padT + plotH - traj * plotH * 0.9;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Execution Horizon t (0 to T)', padL + plotW / 2, height - 6);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f87171';
    ctx.fillText('High λ', width - 15, padT + 12);
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('TWAP (Low λ)', width - 15, padT + 24);
  }

  // 4. Kalman State Tracking
  renderKalmanGraph() {
    const s = this.setupCanvas('graph-kalman');
    if (!s) return;
    const { ctx, width, height } = s;

    ctx.clearRect(0, 0, width, height);
    const padL = 35, padR = 15, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const steps = 30;
    let trueState = 0;
    let kalmanState = 0;
    let pVar = 1.0;
    const qVar = 0.05, rVar = 0.4;

    const truePts = [];
    const noisyPts = [];
    const kalmanPts = [];

    for (let i = 0; i < steps; i++) {
      trueState += (Math.random() - 0.48) * 0.4;
      const measurement = trueState + (Math.random() - 0.5) * 1.2;

      // Kalman step
      const pPred = pVar + qVar;
      const kGain = pPred / (pPred + rVar);
      kalmanState = kalmanState + kGain * (measurement - kalmanState);
      pVar = (1 - kGain) * pPred;

      truePts.push(trueState);
      noisyPts.push(measurement);
      kalmanPts.push(kalmanState);
    }

    const yMid = padT + plotH / 2;
    const scaleY = plotH / 4;

    // Draw noisy points
    ctx.fillStyle = '#71717a';
    for (let i = 0; i < steps; i++) {
      const x = padL + (i / (steps - 1)) * plotW;
      const y = yMid - noisyPts[i] * scaleY;
      ctx.beginPath();
      ctx.arc(x, Math.max(padT, Math.min(padT + plotH, y)), 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw True State (Subtle dashed)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = padL + (i / (steps - 1)) * plotW;
      const y = yMid - truePts[i] * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Kalman State Estimate (Clean Blue)
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const x = padL + (i / (steps - 1)) * plotW;
      const y = yMid - kalmanPts[i] * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Time Step k (Recursive MMSE)', padL + plotW / 2, height - 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('— Filtered Estimate x̂ₖ', padL + 4, padT + 10);
  }

  // 5. EVT Tail vs Gaussian Density
  renderEVTGraph() {
    const s = this.setupCanvas('graph-evt');
    if (!s) return;
    const { ctx, width, height } = s;

    ctx.clearRect(0, 0, width, height);
    const padL = 35, padR = 15, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Plot log exceedance probability from 1.5 sigma to 5.0 sigma
    // Gaussian: P(X > x) ~ exp(-x^2 / 2)
    // GPD (Pareto): P(X > x) ~ (1 + xi * x / beta)^(-1/xi)

    ctx.strokeStyle = '#71717a';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const z = 1.5 + (i / 50) * 3.5;
      const logP = -0.5 * z * z; // Gaussian log tail
      const normY = (logP - (-12.5)) / ((-1.12) - (-12.5));
      const x = padL + (i / 50) * plotW;
      const y = padT + plotH - normY * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // EVT Heavy Tail (GPD with xi = 0.3)
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const z = 1.5 + (i / 50) * 3.5;
      const logP = (-1 / 0.3) * Math.log(1 + 0.3 * (z - 1.5) / 0.8) - 1.5;
      const normY = (logP - (-12.5)) / ((-1.12) - (-12.5));
      const x = padL + (i / 50) * plotW;
      const y = padT + plotH - Math.max(0, Math.min(1, normY)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Loss Deviation (+1.5σ to +5.0σ)', padL + plotW / 2, height - 6);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f87171';
    ctx.fillText('EVT / GPD Fat Tail', width - 15, padT + 12);
    ctx.fillStyle = '#71717a';
    ctx.fillText('Gaussian Tail', width - 15, padT + 24);
  }

  // 6. Dupire Local Volatility vs Strike
  renderDupireGraph() {
    const s = this.setupCanvas('graph-dupire');
    if (!s) return;
    const { ctx, width, height } = s;

    ctx.clearRect(0, 0, width, height);
    const padL = 35, padR = 15, padT = 20, padB = 25;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Dupire local volatility curve with typical equity skew
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const k = 70 + (i / 50) * 60; // 70 to 130
      // Monotonic downward skew with slight wing convexity
      const m = (k - 100) / 100;
      const vol = 0.25 - 0.28 * m + 0.35 * m * m;
      const normVol = (vol - 0.15) / (0.45 - 0.15);
      const x = padL + (i / 50) * plotW;
      const y = padT + plotH - normVol * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Strike K (70 to 130)', padL + plotW / 2, height - 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText('Local Volatility σ_loc(K, T)', padL + 4, padT + 12);
  }
}

