/**
 * VSI — Interactive Quantitative Finance & HFT Mathematical Simulators
 * 1. Avellaneda-Stoikov Market Making Simulator
 * 2. Mutually/Self-Exciting Hawkes Process Simulator
 * 3. Ornstein-Uhlenbeck (OU) Mean Reversion & SDE Simulator
 * 4. SABR & Black-Scholes Volatility Smile / Greeks Simulator
 */

// Helper: Standard Normal Box-Muller generator
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* =========================================================================
   1. AVELLANEDA-STOIKOV MARKET MAKING SIMULATOR
   ========================================================================= */
export class AvellanedaStoikovSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.params = {
      s0: 100.0,    // Mid price
      q: 2,         // Inventory (-10 to +10)
      gamma: 0.1,   // Risk aversion (0.01 to 0.5)
      sigma: 0.30,  // Asset volatility
      T_minus_t: 1.0, // Remaining horizon (0.1 to 1.0)
      kappa: 1.5    // Order book liquidity parameter
    };
    this.initControls();
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
  }

  calculate() {
    const { s0, q, gamma, sigma, T_minus_t, kappa } = this.params;
    // Reservation price: r(s, q, t) = s - q * gamma * sigma^2 * (T - t)
    const reservationPrice = s0 - (q * gamma * Math.pow(sigma, 2) * T_minus_t * 100);
    
    // Half spread from Guéant / Avellaneda-Stoikov
    const halfSpread = (1 / gamma) * Math.log(1 + (gamma / kappa));
    
    // Asymmetric quote distances
    const deltaA = (s0 - reservationPrice) + halfSpread;
    const deltaB = (reservationPrice - s0) + halfSpread;

    const askQuote = s0 + Math.max(0.1, deltaA);
    const bidQuote = s0 - Math.max(0.1, deltaB);
    const totalSpread = askQuote - bidQuote;

    return {
      s0,
      reservationPrice,
      bidQuote,
      askQuote,
      deltaA,
      deltaB,
      totalSpread,
      halfSpread
    };
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const res = this.calculate();

    // High DPI scaling
    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 50; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 30; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Dynamic price scale
    const centerPrice = res.s0;
    const priceRange = 8.0; // +/- $4.0 around mid
    const priceToY = (p) => {
      const norm = (centerPrice + priceRange / 2 - p) / priceRange;
      return Math.max(30, Math.min(height - 40, norm * height));
    };

    const midY = priceToY(res.s0);
    const resY = priceToY(res.reservationPrice);
    const askY = priceToY(res.askQuote);
    const bidY = priceToY(res.bidQuote);

    // Draw Quote Band (Fill spread area)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(100, askY, width - 260, bidY - askY);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.strokeRect(100, askY, width - 260, bidY - askY);

    // Draw Mid Price (Reference Dashed Line)
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(70, midY);
    ctx.lineTo(width - 140, midY);
    ctx.stroke();

    // Draw Reservation Price (Cyan Solid Line)
    ctx.setLineDash([]);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(70, resY);
    ctx.lineTo(width - 140, resY);
    ctx.stroke();

    // Draw Ask Quote Line (Rose/Red)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, askY);
    ctx.lineTo(width - 150, askY);
    ctx.stroke();

    // Draw Bid Quote Line (Emerald/Green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, bidY);
    ctx.lineTo(width - 150, bidY);
    ctx.stroke();

    // Labels & Text
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`Mid: $${res.s0.toFixed(2)}`, 65, midY + 4);

    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`r(s,q,t): $${res.reservationPrice.toFixed(2)}`, 65, resY + 4);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`Ask Quote (rᵃ): $${res.askQuote.toFixed(2)} (δᵃ = +${res.deltaA.toFixed(2)})`, width - 130, askY + 4);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`Bid Quote (rᵇ): $${res.bidQuote.toFixed(2)} (δᵇ = -${res.deltaB.toFixed(2)})`, width - 130, bidY + 4);

    // Inventory Tilt Indicator
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillText(`Inventory: q = ${this.params.q > 0 ? '+' : ''}${this.params.q}`, 20, 25);
    
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = this.params.q > 0 ? '#f43f5e' : (this.params.q < 0 ? '#10b981' : '#94a3b8');
    const tiltText = this.params.q > 0 
      ? `▶ Long inventory: Skews quotes lower to stimulate Ask fills & reduce risk` 
      : (this.params.q < 0 
        ? `▶ Short inventory: Skews quotes higher to stimulate Bid fills` 
        : `▶ Balanced inventory: Symmetrical quotes centered around mid`);
    ctx.fillText(tiltText, 170, 25);

    // Spread summary in corner
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'right';
    ctx.fillText(`Optimal Spread: $${res.totalSpread.toFixed(2)}`, width - 20, height - 15);
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
    this.params = {
      mu: 1.2,      // Baseline intensity
      alpha: 1.5,   // Jump excitation size
      beta: 2.0,    // Exponential decay rate
      T: 10.0       // Time window in seconds
    };
    this.events = [];
    this.initControls();
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
      regenBtn.addEventListener('click', () => this.simulate());
    }
  }

  // Ogata's thinning algorithm for univariate Hawkes
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

      // Current intensity at proposed time t
      let currentLambda = mu;
      for (const ti of this.events) {
        currentLambda += alpha * Math.exp(-beta * (t - ti));
      }

      const u2 = Math.random();
      if (u2 <= currentLambda / lambdaStar) {
        // Accept event
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
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const { mu, alpha, beta, T } = this.params;
    const branchingRatio = (alpha / beta).toFixed(2);

    ctx.clearRect(0, 0, width, height);

    // Compute max intensity for Y scale
    let maxLambda = mu * 2.5;
    const numPoints = 300;
    const dt = T / numPoints;
    const lambdaSeries = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i * dt;
      const lam = this.intensityAt(t);
      lambdaSeries.push({ t, lam });
      if (lam > maxLambda) maxLambda = lam;
    }
    maxLambda *= 1.15;

    // Coordinate transforms
    const padL = 50, padR = 25, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tToX = (t) => padL + (t / T) * plotW;
    const lamToY = (l) => padT + plotH - (l / maxLambda) * plotH;

    // Draw baseline intensity level
    const baseLineY = lamToY(mu);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
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
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Intensity Line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < lambdaSeries.length; i++) {
      const pt = lambdaSeries[i];
      const x = tToX(pt.t);
      const y = lamToY(pt.lam);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Order Arrival Events (vertical markers)
    for (const tEvent of this.events) {
      const x = tToX(tEvent);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, padT + plotH);
      ctx.lineTo(x, padT + plotH + 8);
      ctx.stroke();

      // Mini burst dot at event peak
      const lamEvent = this.intensityAt(tEvent);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, lamToY(lamEvent), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axes & Labels
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxLambda.toFixed(1)} λ`, padL - 8, padT + 10);
    ctx.fillText(`${mu.toFixed(1)} μ`, padL - 8, baseLineY + 4);
    ctx.fillText('0', padL - 8, padT + plotH);

    ctx.textAlign = 'center';
    ctx.fillText('0s', padL, height - 15);
    ctx.fillText(`${(T / 2).toFixed(0)}s`, padL + plotW / 2, height - 15);
    ctx.fillText(`${T.toFixed(0)}s (Time)`, padL + plotW, height - 15);

    // Title / Metrics HUD
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Total Order Events: ${this.events.length}`, padL, 20);

    const isStationary = alpha < beta;
    ctx.fillStyle = isStationary ? '#10b981' : '#f43f5e';
    ctx.textAlign = 'right';
    ctx.fillText(`Branching Ratio η = α/β: ${branchingRatio} ${isStationary ? '(Stationary < 1.0)' : '(Explosive ≥ 1.0)'}`, width - padR, 20);
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
    this.params = {
      theta: 1.5,   // Mean reversion speed
      mu: 0.0,      // Equilibrium level
      sigma: 0.4,   // Diffusion parameter
      x0: 1.2,      // Initial deviation
      T: 5.0,       // Duration
      numPaths: 4   // Number of Monte Carlo paths
    };
    this.paths = [];
    this.initControls();
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
      regenBtn.addEventListener('click', () => this.simulate());
    }
  }

  simulate() {
    const { theta, mu, sigma, x0, T, numPaths } = this.params;
    const steps = 250;
    const dt = T / steps;
    this.paths = [];

    // Exact Gaussian transition formula for OU process:
    // X_{t+dt} = X_t * e^(-theta*dt) + mu*(1 - e^(-theta*dt)) + sigma*sqrt((1 - e^(-2*theta*dt))/(2*theta)) * N(0,1)
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
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const { theta, mu, sigma, T } = this.params;

    ctx.clearRect(0, 0, width, height);

    // Asymptotic standard deviation: sigma_inf = sigma / sqrt(2*theta)
    const statStd = sigma / Math.sqrt(2 * theta);
    const halfLife = Math.log(2) / theta;

    const padL = 50, padR = 30, padT = 35, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const yMin = mu - 3.2 * statStd;
    const yMax = mu + 3.2 * statStd;

    const tToX = (t) => padL + (t / T) * plotW;
    const xToY = (x) => padT + plotH - ((x - yMin) / (yMax - yMin)) * plotH;

    // Stationary Confidence Band (+/- 2 sigma_inf)
    const bandTop = xToY(mu + 2 * statStd);
    const bandBottom = xToY(mu - 2 * statStd);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.fillRect(padL, bandTop, plotW, bandBottom - bandTop);

    // +/- 1 sigma_inf
    const band1Top = xToY(mu + statStd);
    const band1Bottom = xToY(mu - statStd);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(padL, band1Top, plotW, band1Bottom - band1Top);

    // Mean Line (μ)
    const muY = xToY(mu);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, muY);
    ctx.lineTo(padL + plotW, muY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Path colors
    const pathColors = ['#06b6d4', '#3b82f6', '#a855f7', '#f59e0b'];

    // Draw Simulated Paths
    for (let p = 0; p < this.paths.length; p++) {
      const path = this.paths[p];
      ctx.strokeStyle = pathColors[p % pathColors.length];
      ctx.lineWidth = 2.0;
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
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`${(mu + 2 * statStd).toFixed(2)} (+2σ)`, padL - 8, bandTop + 4);
    ctx.fillText(`μ = ${mu.toFixed(2)}`, padL - 8, muY + 4);
    ctx.fillText(`${(mu - 2 * statStd).toFixed(2)} (-2σ)`, padL - 8, bandBottom + 4);

    ctx.textAlign = 'center';
    ctx.fillText('t=0', padL, height - 15);
    ctx.fillText(`t=${(T / 2).toFixed(1)}s`, padL + plotW / 2, height - 15);
    ctx.fillText(`t=${T.toFixed(1)}s`, padL + plotW, height - 15);

    // Header Metrics
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Half-Life τ₁/₂ = ln(2)/θ = ${halfLife.toFixed(2)}s`, padL, 20);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Stationary σ_∞ = σ/√(2θ) = ${statStd.toFixed(3)}`, width - padR, 20);
  }
}

/* =========================================================================
   4. BLACK-SCHOLES GREEKS & SABR VOLATILITY SMILE SIMULATOR
   ========================================================================= */
export class SABRBlackScholesSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.params = {
      f: 100.0,     // Forward price
      T: 1.0,       // Expiry in years
      alpha: 0.25,  // SABR ATM volatility parameter
      beta: 0.8,    // Elasticity (0 to 1)
      rho: -0.35,   // Correlation between asset and volatility
      nu: 0.40      // Vol-of-vol
    };
    this.initControls();
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
  }

  // Hagan et al. SABR analytical implied volatility expansion
  calculateSABR(K) {
    const { f, T, alpha, beta, rho, nu } = this.params;
    if (Math.abs(f - K) < 1e-4) {
      // ATM expansion
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
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const { f, rho, nu } = this.params;

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

    const padL = 60, padR = 30, padT = 35, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const kToX = (K) => padL + ((K - minK) / (maxK - minK)) * plotW;
    const vToY = (v) => padT + plotH - ((v - minVol) / (maxVol - minVol)) * plotH;

    // ATM vertical marker
    const atmX = kToX(f);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(atmX, padT);
    ctx.lineTo(atmX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve Gradient Fill
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    for (let i = 0; i < strikes.length; i++) {
      ctx.lineTo(kToX(strikes[i]), vToY(vols[i]));
    }
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // SABR Smile Curve
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < strikes.length; i++) {
      const x = kToX(strikes[i]);
      const y = vToY(vols[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Axes
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`${(maxVol * 100).toFixed(0)}% IV`, padL - 8, padT + 10);
    ctx.fillText(`${(minVol * 100).toFixed(0)}% IV`, padL - 8, padT + plotH);

    ctx.textAlign = 'center';
    ctx.fillText(`${minK}`, padL, height - 15);
    ctx.fillText(`K=${f.toFixed(0)} (ATM)`, atmX, height - 15);
    ctx.fillText(`${maxK}`, padL + plotW, height - 15);

    // Header info
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`SABR Implied Volatility Smile / Skew`, padL, 20);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#a855f7';
    const skewType = rho < -0.1 ? 'Negative Skew (Equities)' : (rho > 0.1 ? 'Positive Skew (Commodities)' : 'Symmetric Smile (FX)');
    ctx.fillText(`ρ = ${rho.toFixed(2)}: ${skewType}`, width - padR, 20);
  }
}
