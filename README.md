# VSI — Quantitative Mathematics & High-Frequency Probability Models

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Math: KaTeX](https://img.shields.io/badge/Math-KaTeX-06B6D4.svg)](https://katex.org)
[![Tech: Zero--Build](https://img.shields.io/badge/Runtime-Zero--Build%20Static-3B82F6.svg)](#)

An authoritative, mathematically rigorous compendium and interactive laboratory covering the probability measures, stochastic differential equations, order book microstructures, and point processes powering institutional High-Frequency Trading (HFT) and quantitative finance.

---

## 🌟 Interactive Simulation Suite

VSI features 4 live, high-precision visualizers powered by HTML5 Canvas & standard numeric approximations:

1. **Avellaneda-Stoikov Market Maker**: Interactively slide inventory $q \in [-8, +8]$, risk aversion $\gamma$, and volatility $\sigma$ to observe continuous reservation price skewing $r(s,q,t) = s - q\gamma\sigma^2(T-t)$ and optimal bid/ask quote placement.
2. **Hawkes Process Order Cascades**: Simulates clustered order arrivals via Ogata's thinning algorithm $\lambda(t) = \mu + \sum_{t_i < t} \alpha e^{-\beta(t - t_i)}$ with real-time branching ratio calculation $\eta = \alpha / \beta$.
3. **Ornstein-Uhlenbeck (OU) Mean-Reverting SDE**: Simulates Monte Carlo trajectories of $dX_t = \theta(\mu - X_t)dt + \sigma dW_t$ alongside theoretical asymptotic Gaussian variance $\pm 1\sigma_\infty, \pm 2\sigma_\infty$ bands.
4. **SABR Volatility Smile / Skew**: Visualizes Hagan et al. closed-form asymptotic implied volatility $\sigma_{\text{implied}}(K, F)$ across strikes, highlighting negative equity skew ($\rho < 0$) and vol-of-vol wings ($\nu$).

---

## 📚 Mathematical Codex Overview

| Discipline | Key Theorems & Formulations | Core Formula |
|:---|:---|:---|
| **Market Microstructure** | Mutually Exciting Hawkes Processes, Stoikov's Micro-Price, Kyle's Lambda, Bouchaud Transient Impact | $\lambda_i(t) = \mu_i + \sum_j \int_0^t \alpha_{ij} e^{-\beta_{ij}(t-s)} dN_j(s)$ |
| **Optimal Execution** | Avellaneda-Stoikov HJB, Guéant-Tapia-Manziadi Asymptotics, Almgren-Chriss Liquidation | $x_j = \frac{\sinh(\kappa(T - t_j))}{\sinh(\kappa T)} X_0$ |
| **Stochastic Calculus** | Multidimensional Itô's Lemma, Ornstein-Uhlenbeck SDE, Fokker-Planck PDE, Girsanov Measure Shift | $\frac{\partial p}{\partial t} = -\frac{\partial}{\partial x}[\mu p] + \frac{1}{2}\frac{\partial^2}{\partial x^2}[\sigma^2 p]$ |
| **Volatility Surfaces** | Black-Scholes Cross-Greeks (Vanna, Volga), Heston Stochastic Volatility, Dupire Local Volatility | $\sigma_{\text{loc}}^2(K, T) = \frac{\partial_T C + (r-q)K \partial_K C + qC}{\frac{1}{2}K^2 \partial_{KK} C}$ |
| **State Filtering** | Linear Discrete Kalman Filter, Riccati Updates, Hidden Markov Models (HMM) & Viterbi Decoding | $\mathbf{K}_k = \mathbf{P}_k^- \mathbf{H}_k^T (\mathbf{H}_k \mathbf{P}_k^- \mathbf{H}_k^T + \mathbf{R}_k)^{-1}$ |
| **Quantitative Risk** | Extreme Value Theory (EVT), Pickands-Balkema-de Haan (GPD), Copula Dependency, Johansen Cointegration | $G_{\xi, \beta}(y) = 1 - (1 + \xi y / \beta)^{-1/\xi}$ |

---

## 🚀 Instant Deployment to GitHub & GitHub Pages

This project is built using zero-build web technologies (Tailwind CSS CDN, KaTeX, Lucide, Vanilla ES6). It requires **no npm build step** and can be deployed directly to GitHub Pages.

### Step 1: Initialize Git and Push to GitHub

```bash
cd vsi-website
git init
git add .
git commit -m "feat: initial commit of VSI quantitative platform"
git branch -M main
git remote add origin https://github.com/<your-username>/vsi.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Navigate to your repository on GitHub: `https://github.com/<your-username>/vsi`
2. Click **Settings** &rarr; **Pages** (under Code and automation in the left sidebar).
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** (the included `.github/workflows/deploy.yml` will automatically build and publish).
   - *Alternatively*: Select **Deploy from a branch**, choose `main`, and select `/ (root)`.
4. Your website will be live at:
   ```
   https://<your-username>.github.io/vsi/
   ```

---

## 💻 Local Preview

To view the website locally without any server dependencies:
- Double-click `index.html` in your file explorer, or
- Run a lightweight Python or Node HTTP server:
  ```bash
  # Python
  python -m http.server 8080

  # Or Node
  npx serve .
  ```
  Then open `http://localhost:8080` in any modern web browser.

---

## 🔒 Proprietary Logic Isolation Notice

This repository contains **strictly theoretical, open-source mathematical models, standard financial theorems, and academic algorithms**. It contains zero proprietary trading strategies, alpha formulations, or internal broker connections.

---

## 📄 References & Academic Literature

- **Avellaneda, M., & Stoikov, S. (2008)**. *High-frequency trading in a limit order book*. Quantitative Finance, 8(3), 217-224.
- **Almgren, R., & Chriss, N. (2000)**. *Optimal execution of portfolio transactions*. Journal of Risk, 3, 5-40.
- **Hagan, P. S., Kumar, D., Lesniewski, A. S., & Woodward, D. E. (2002)**. *Managing smile risk*. Wilmott Magazine, 84-108.
- **Bouchaud, J. P., Gefen, Y., Potters, M., & Wyart, M. (2004)**. *Fluctuations and response in financial markets: the subtle nature of "random" price changes*. Quantitative Finance, 4(2), 176-185.
- **Dupire, B. (1994)**. *Pricing with a smile*. Risk, 7(1), 18-20.
- **Heston, S. L. (1993)**. *A closed-form solution for options with stochastic volatility with applications to bond and currency options*. Review of Financial Studies, 6(2), 327-343.
- **Cont, R., Stoikov, S., & Talreja, R. (2010)**. *A stochastic model for order book dynamics*. Operations Research, 58(3), 549-563.

---

## ⚖️ License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
