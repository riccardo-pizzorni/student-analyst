import { TheoryButton, TheoryContent, WithTheory } from './ui/TheoryButton';
import './ui/TheoryButton.css';

// Sample theory contents for financial concepts
const sharpeRatioTheory: TheoryContent = {
  title: "Sharpe Ratio",
  category: "Risk-Adjusted Performance Measures",
  overview: "Il Sharpe Ratio è una metrica fondamentale per valutare il rendimento aggiustato per il rischio di un investimento o portafoglio, sviluppata da William F. Sharpe nel 1966.",
  theory: `Il Sharpe Ratio misura l'eccesso di rendimento per unità di rischio assumita. È definito come:

$$\\text{Sharpe Ratio} = \\frac{R_p - R_f}{\\sigma_p}$$

Dove:
- $R_p$ = rendimento atteso del portafoglio
- $R_f$ = tasso risk-free (generalmente titoli di stato)
- $\\sigma_p$ = volatilità (deviazione standard) del portafoglio

Una versione più precisa considera i rendimenti nel tempo:

$$\\text{Sharpe Ratio} = \\frac{\\mathbb{E}[R_p - R_f]}{\\sqrt{\\text{Var}(R_p - R_f)}}$$

Il ratio può essere annualizzato moltiplicando per $\\sqrt{252}$ per dati giornalieri.`,
  keyPoints: [
    "Più alto è il Sharpe Ratio, migliore è il rendimento aggiustato per il rischio",
    "Un valore superiore a 1.0 è considerato buono, superiore a 2.0 eccellente",
    "Permette confronti diretti tra asset con diversi profili di rischio",
    "Assume distribuzione normale dei rendimenti (limitazione importante)",
    "Sensibile alla scelta del benchmark risk-free"
  ],
  applications: [
    "Selezione di portafogli e strategie di investimento",
    "Valutazione performance di fund manager",
    "Ottimizzazione di asset allocation",
    "Benchmarking tra diversi investimenti",
    "Risk budgeting in gestioni istituzionali"
  ],
  limitations: [
    "Assume normalità dei rendimenti (problematico con fat tails)",
    "Penalizza sia volatilità negativa che positiva",
    "Sensibile a outliers estremi",
    "Non cattura rischi di tail risk e skewness",
    "Può essere manipolato con strategie che vendono volatilità"
  ],
  examples: [
    `**Esempio Pratico:**

Consideriamo due portafogli:
- Portafoglio A: rendimento 12%, volatilità 15%
- Portafoglio B: rendimento 10%, volatilità 8%
- Risk-free rate: 2%

$$\\text{Sharpe}_A = \\frac{12\\% - 2\\%}{15\\%} = 0.67$$

$$\\text{Sharpe}_B = \\frac{10\\% - 2\\%}{8\\%} = 1.00$$

Il Portafoglio B ha un migliore rendimento aggiustato per il rischio.`
  ],
  references: [
    {
      title: "Capital Asset Prices: A Theory of Market Equilibrium under Conditions of Risk",
      author: "William F. Sharpe",
      year: 1964,
      type: "paper",
      url: "https://www.jstor.org/stable/2977928",
      description: "Paper originale che introduce il modello CAPM e le basi teoriche"
    },
    {
      title: "The Sharpe Ratio",
      author: "William F. Sharpe",
      year: 1994,
      type: "paper",
      url: "https://web.stanford.edu/~wfsharpe/art/sr/sr.html",
      description: "Riflessioni dell'autore sull'evoluzione e uso della sua metrica"
    },
    {
      title: "Quantitative Portfolio Management",
      author: "Fabozzi, Kolm, Pachamanova, Focardi",
      year: 2010,
      type: "book",
      url: "https://www.wiley.com/en-us/Quantitative+Equity+Investing",
      description: "Trattazione completa delle metriche di performance"
    }
  ],
  relatedTopics: ["Information Ratio", "Sortino Ratio", "Treynor Ratio", "Jensen's Alpha", "CAPM"]
};

const capmTheory: TheoryContent = {
  title: "Capital Asset Pricing Model (CAPM)",
  category: "Asset Pricing Models",
  overview: "Il CAPM è un modello fondamentale nella teoria finanziaria che descrive la relazione tra rischio sistematico e rendimento atteso per gli asset in mercati efficienti.",
  theory: `Il CAPM stabilisce che il rendimento atteso di un asset è funzione del suo rischio sistematico (beta):

$$\\mathbb{E}[R(i)] = R_f + \\beta(i) (\\mathbb{E}[R_m] - R_f)$$

Dove:
- $\\mathbb{E}[R(i)]$ = rendimento atteso dell'asset i
- $R_f$ = tasso risk-free
- $\\beta(i)$ = beta dell'asset (sensibilità al mercato)
- $\\mathbb{E}[R_m]$ = rendimento atteso del mercato
- $(\\mathbb{E}[R_m] - R_f)$ = market risk premium

Il beta è calcolato come:

$$\\beta(i) = \\frac{\\text{Cov}(R(i), R_m)}{\\text{Var}(R_m)} = \\frac{\\sigma_{i,m}}{\\sigma_m^2}$$

La Security Market Line (SML) rappresenta graficamente questa relazione.`,
  keyPoints: [
    "Beta = 1: asset si muove in linea con il mercato",
    "Beta > 1: asset più volatile del mercato (amplifica movimenti)",
    "Beta < 1: asset meno volatile del mercato (difensivo)",
    "Solo il rischio sistematico viene remunerato",
    "Il rischio idiosincratico può essere eliminato con diversificazione"
  ],
  applications: [
    "Valutazione di titoli e calcolo del costo del capitale",
    "Costruzione di portafogli market-neutral",
    "Risk attribution e performance attribution",
    "Determinazione di hurdle rates per progetti di investimento",
    "Hedge ratio per strategie di copertura"
  ],
  limitations: [
    "Assume mercati perfetti (nessun costo di transazione, tasse)",
    "Richiede identificazione del 'vero' portafoglio di mercato",
    "Beta instabile nel tempo (beta decay)",
    "Non cattura fattori di rischio multipli",
    "Evidenze empiriche mostrano anomalie (effetto size, value)"
  ],
  examples: [
    `**Calcolo Pratica del Beta:**

Supponiamo di avere:
- Covarianza(Stock, Market) = 0.024
- Varianza(Market) = 0.016

$$\\beta = \\frac{0.024}{0.016} = 1.5$$

Se il market risk premium è 6% e il risk-free rate è 2%:

$$\\mathbb{E}[R] = 2\\% + 1.5 \\times 6\\% = 11\\%$$

L'asset ha un rendimento atteso dell'11%.`
  ],
  references: [
    {
      title: "Capital Asset Prices: A Theory of Market Equilibrium under Conditions of Risk",
      author: "William F. Sharpe",
      year: 1964,
      type: "paper",
      url: "https://www.jstor.org/stable/2977928",
      description: "Paper fondamentale che introduce il CAPM"
    },
    {
      title: "Security Prices, Risk, and Maximal Gains From Diversification",
      author: "John Lintner",
      year: 1965,
      type: "paper",
      url: "https://www.jstor.org/stable/2977249",
      description: "Sviluppo indipendente del CAPM da parte di Lintner"
    },
    {
      title: "An Intertemporal Capital Asset Pricing Model",
      author: "Robert C. Merton",
      year: 1973,
      type: "paper",
      url: "https://www.jstor.org/stable/1913811",
      description: "Estensione dinamica del CAPM"
    }
  ],
  relatedTopics: ["Fama-French Model", "Arbitrage Pricing Theory", "Market Model", "Jensen's Alpha"]
};

const portfolioOptimizationTheory: TheoryContent = {
  title: "Modern Portfolio Theory (Markowitz)",
  category: "Portfolio Optimization",
  overview: "La Teoria Moderna del Portafoglio di Harry Markowitz rivoluziona l'investimento introducendo il concetto di ottimizzazione mean-variance per costruire portafogli efficienti.",
  theory: `L'obiettivo è massimizzare il rendimento per un dato livello di rischio, o minimizzare il rischio per un dato rendimento:

**Problema di Ottimizzazione:**

$$\\min_{w} \\quad w^T \\Sigma w$$
$$\\text{s.t.} \\quad w^T \\mu = \\mu_p$$
$$\\quad\\quad\\quad w^T \\mathbf{1} = 1$$

Dove:
- $w$ = vettore dei pesi del portafoglio
- $\\Sigma$ = matrice di covarianza dei rendimenti
- $\\mu$ = vettore dei rendimenti attesi
- $\\mu_p$ = rendimento target del portafoglio

La **Efficient Frontier** è definita da:

$$\\sigma_p^2 = \\frac{C\\mu_p^2 - 2B\\mu_p + A}{\\Delta}$$

Dove $A = \\mathbf{1}^T\\Sigma^{-1}\\mathbf{1}$, $B = \\mathbf{1}^T\\Sigma^{-1}\\mu$, $C = \\mu^T\\Sigma^{-1}\\mu$, e $\\Delta = AC - B^2$.`,
  keyPoints: [
    "Diversificazione riduce il rischio senza necessariamente ridurre il rendimento",
    "Esiste un insieme di portafogli 'efficienti' (efficient frontier)",
    "Il rischio di portafoglio dipende da covarianze, non solo da varianze individuali",
    "Two-fund separation: tutti i portafogli efficienti sono combinazioni di due portafogli base",
    "Il portafoglio ottimo dipende dall'avversione al rischio dell'investitore"
  ],
  applications: [
    "Asset allocation strategica per fondi pensione e assicurazioni",
    "Costruzione di portafogli diversificati per clienti privati",
    "Risk parity e minimum variance strategies",
    "Factor investing e smart beta products",
    "Tactical asset allocation e rebalancing"
  ],
  limitations: [
    "Richiede stima accurata di rendimenti, varianze e correlazioni",
    "Sensibile agli errori di stima (error maximization)",
    "Assume distribuzione normale dei rendimenti",
    "Non considera costi di transazione e liquidità",
    "Ignora vincoli pratici (minimum lots, short selling constraints)"
  ],
  examples: [
    `**Esempio con Due Asset:**

Asset A: $\\mu_A = 8\\%$, $\\sigma_A = 12\\%$
Asset B: $\\mu_B = 12\\%$, $\\sigma_B = 20\\%$
Correlazione: $\\rho_{AB} = 0.3$

Varianza del portafoglio:
$$\\sigma_p^2 = w_A^2\\sigma_A^2 + w_B^2\\sigma_B^2 + 2w_Aw_B\\rho_{AB}\\sigma_A\\sigma_B$$

Per $w_A = 0.6, w_B = 0.4$:
$$\\sigma_p^2 = 0.36 \\times 0.0144 + 0.16 \\times 0.04 + 2 \\times 0.6 \\times 0.4 \\times 0.3 \\times 0.12 \\times 0.2$$
$$= 0.005184 + 0.0064 + 0.001728 = 0.013312$$
$$\\sigma_p = 11.54\\%$$

Rendimento portafoglio: $\\mu_p = 0.6 \\times 8\\% + 0.4 \\times 12\\% = 9.6\\%$`
  ],
  references: [
    {
      title: "Portfolio Selection",
      author: "Harry M. Markowitz",
      year: 1952,
      type: "paper",
      url: "https://www.jstor.org/stable/2975974",
      description: "Paper fondamentale che introduce la teoria moderna del portafoglio"
    },
    {
      title: "Portfolio Selection: Efficient Diversification of Investments",
      author: "Harry M. Markowitz",
      year: 1959,
      type: "book",
      url: "https://www.jstor.org/stable/j.ctt1bh4c8h",
      description: "Libro completo sulla teoria del portafoglio"
    },
    {
      title: "The Black-Litterman Model: A Practical Approach",
      author: "Attilio Meucci",
      year: 2010,
      type: "article",
      url: "https://ssrn.com/abstract=1117574",
      description: "Approccio moderno all'ottimizzazione Bayesiana"
    }
  ],
  relatedTopics: ["Black-Litterman Model", "Risk Parity", "Factor Models", "Resampled Efficiency"]
};

const varTheory: TheoryContent = {
  title: "Value at Risk (VaR)",
  category: "Risk Management",
  overview: "Il Value at Risk è una misura statistica che quantifica il potenziale di perdita di un portafoglio in condizioni normali di mercato, entro un orizzonte temporale e livello di confidenza specificati.",
  theory: `Il VaR risponde alla domanda: "Quale è la massima perdita attesa con probabilità α in un periodo T?"

Formalmente, per un portafoglio con P&L $X$:
$$\\text{VaR}_\\alpha(X) = -\\inf\\{x \\in \\mathbb{R} : P(X \\leq x) > \\alpha\\}$$

**Metodi di Calcolo:**

**1. Metodo Parametrico (Variance-Covariance):**
$$\\text{VaR} = z_\\alpha \\times \\sigma_p \\times \\sqrt{T} \\times V$$

**2. Simulazione Storica:**
$$\\text{VaR} = \\text{Percentile}_{\\alpha}(\\text{Historical P&L})$$

**3. Monte Carlo:**
Simulazione di scenari casuali basati su modelli stocastici.

Il **Conditional VaR (Expected Shortfall)** misura la perdita attesa oltre il VaR:
$$\\text{CVaR}_\\alpha = \\mathbb{E}[X | X \\leq -\\text{VaR}_\\alpha]$$`,
  keyPoints: [
    "Espresso in unità monetarie o percentuali",
    "Comunemente calcolato per α = 1% o 5% su orizzonti di 1 giorno o 10 giorni",
    "Non è una misura coerente di rischio (non subadditiva)",
    "CVaR/Expected Shortfall è preferibile per ottimizzazione",
    "Backtesting essenziale per validare i modelli"
  ],
  applications: [
    "Limite di rischio per trading desks e portafogli",
    "Calcolo del capitale regolamentare (Basel III)",
    "Risk reporting a management e board",
    "Ottimizzazione di portafoglio risk-constrained",
    "Stress testing e scenario analysis"
  ],
  limitations: [
    "Assume che la storia si ripeta (no regime changes)",
    "Non cattura tail risks estremi",
    "Modelli parametrici assumono normalità",
    "Sensibile alla finestra temporale storica scelta",
    "Non fornisce informazioni sulle perdite oltre il VaR"
  ],
  examples: [
    `**Esempio Parametrico:**

Portafoglio: €10 milioni
Volatilità giornaliera: 2%
Livello di confidenza: 95% (z = 1.645)

$$\\text{VaR}_{95\\%} = 1.645 \\times 0.02 \\times €10M = €329,000$$

Interpretazione: c'è un 5% di probabilità di perdere più di €329,000 in un giorno.

**Scaling temporale per 10 giorni:**
$$\\text{VaR}_{10d} = €329,000 \\times \\sqrt{10} = €1,040,000$$`
  ],
  references: [
    {
      title: "RiskMetrics Technical Document",
      author: "J.P. Morgan",
      year: 1996,
      type: "article",
      url: "https://www.jpmorgan.com/insights/research/riskmetrics",
      description: "Documento tecnico che standardizza il calcolo del VaR"
    },
    {
      title: "Coherent Measures of Risk",
      author: "Artzner, Delbaen, Eber, Heath",
      year: 1999,
      type: "paper",
      url: "https://www.jstor.org/stable/2669644",
      description: "Introduzione delle misure coerenti di rischio"
    },
    {
      title: "An Introduction to Financial Risk Management",
      author: "Anthony Saunders & Marcia Cornett",
      year: 2020,
      type: "book",
      url: "https://www.mheducation.com/highered/product/introduction-financial-risk",
      description: "Trattazione completa del risk management finanziario"
    }
  ],
  relatedTopics: ["Expected Shortfall", "Extreme Value Theory", "GARCH Models", "Stress Testing"]
};

export function TheoryDemo() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Theory Buttons Demo - Sistema Educativo Avanzato
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Pulsanti discreti "?" che aprono finestre educative complete con teoria finanziaria professionale, 
          formule LaTeX, riferimenti accademici e formato ottimizzato per la stampa.
        </p>
      </div>

      {/* Basic Examples */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Esempi Base - Metriche di Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <WithTheory
              topic="Sharpe Ratio"
              content={sharpeRatioTheory}
              containerClassName="mb-3"
            >
              <h3 className="text-lg font-semibold text-blue-900">Sharpe Ratio</h3>
            </WithTheory>
            <p className="text-blue-800 text-sm">
              Misura il rendimento aggiustato per il rischio di un investimento
            </p>
            <div className="mt-2 text-2xl font-bold text-blue-900">1.47</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <WithTheory
              topic="Information Ratio"
              content={{
                title: "Information Ratio",
                category: "Performance Attribution",
                overview: "L'Information Ratio misura la capacità di un gestore di generare rendimenti in eccesso rispetto al benchmark, aggiustati per il tracking error.",
                theory: "L'Information Ratio è definito come: $$\\text{IR} = \\frac{\\mathbb{E}[R_p - R_b]}{\\sigma(R_p - R_b)}$$ dove $R_p$ è il rendimento del portafoglio, $R_b$ il rendimento del benchmark, e $\\sigma(R_p - R_b)$ è il tracking error.",
                keyPoints: ["Misura l'abilità del gestore", "Più alto è meglio", "Correlato al Sharpe Ratio"],
                applications: ["Valutazione fund manager", "Selezione di fondi attivi"],
                references: [{
                  title: "Active Portfolio Management",
                  author: "Grinold & Kahn",
                  type: "book",
                  url: "https://www.mheducation.com/active-portfolio-management"
                }]
              }}
              containerClassName="mb-3"
            >
              <h3 className="text-lg font-semibold text-green-900">Information Ratio</h3>
            </WithTheory>
            <p className="text-green-800 text-sm">
              Valuta l'abilità del gestore vs benchmark
            </p>
            <div className="mt-2 text-2xl font-bold text-green-900">0.89</div>
          </div>
        </div>
      </section>

      {/* Advanced Models */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Modelli Avanzati - Asset Pricing</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <WithTheory
                topic="CAPM"
                content={capmTheory}
                containerClassName="mb-2"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  Capital Asset Pricing Model (CAPM)
                </h3>
              </WithTheory>
              <p className="text-gray-600 text-sm">
                Modello fondamentale per il pricing degli asset basato su rischio sistematico
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Expected Return</div>
              <div className="text-xl font-bold text-gray-900">11.2%</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <WithTheory
                topic="Portfolio Optimization"
                content={portfolioOptimizationTheory}
                containerClassName="mb-2"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  Modern Portfolio Theory (Markowitz)
                </h3>
              </WithTheory>
              <p className="text-gray-600 text-sm">
                Ottimizzazione mean-variance per costruire portafogli efficienti
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Optimal Weights</div>
              <div className="text-xl font-bold text-gray-900">60% / 40%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Management */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Risk Management Avanzato</h2>
        
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <WithTheory
                topic="Value at Risk"
                content={varTheory}
                containerClassName="mb-3"
              >
                <h3 className="text-xl font-semibold text-red-900">Value at Risk (VaR)</h3>
              </WithTheory>
              <p className="text-red-800 mb-4">
                Quantifica il potenziale di perdita in condizioni normali di mercato
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-red-600">1-Day VaR (95%)</div>
                  <div className="text-lg font-bold text-red-900">€247,500</div>
                </div>
                <div>
                  <div className="text-sm text-red-600">10-Day VaR (95%)</div>
                  <div className="text-lg font-bold text-red-900">€783,200</div>
                </div>
                <div>
                  <div className="text-sm text-red-600">Expected Shortfall</div>
                  <div className="text-lg font-bold text-red-900">€412,300</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demonstrations */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Funzionalità Avanzate</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Size Variations */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Dimensioni Diverse</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Small:</span>
                <TheoryButton
                  topic="Beta"
                  content={{
                    title: "Beta Coefficient", 
                    category: "Risk Metrics",
                    overview: "Misura la sensibilità di un asset ai movimenti del mercato",
                    theory: "$$\\beta = \\frac{\\text{Cov}(R(i), R_m)}{\\text{Var}(R_m)}$$",
                    keyPoints: ["Beta > 1: più volatile del mercato"],
                    applications: ["Hedging", "Asset allocation"],
                    references: []
                  }}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Medium:</span>
                <TheoryButton
                  topic="Beta"
                  content={{
                    title: "Beta Coefficient", 
                    category: "Risk Metrics",
                    overview: "Misura la sensibilità di un asset ai movimenti del mercato",
                    theory: "$$\\beta = \\frac{\\text{Cov}(R(i), R_m)}{\\text{Var}(R_m)}$$",
                    keyPoints: ["Beta > 1: più volatile del mercato"],
                    applications: ["Hedging", "Asset allocation"],
                    references: []
                  }}
                  size="md"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Large:</span>
                <TheoryButton
                  topic="Beta"
                  content={{
                    title: "Beta Coefficient", 
                    category: "Risk Metrics",
                    overview: "Misura la sensibilità di un asset ai movimenti del mercato",
                    theory: "$$\\beta = \\frac{\\text{Cov}(R(i), R_m)}{\\text{Var}(R_m)}$$",
                    keyPoints: ["Beta > 1: più volatile del mercato"],
                    applications: ["Hedging", "Asset allocation"],
                    references: []
                  }}
                  size="lg"
                />
              </div>
            </div>
          </div>

          {/* Print Demonstration */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold mb-3">Formato Stampa</h4>
            <p className="text-sm text-gray-600 mb-3">
              Ogni modal include un pulsante "Stampa" ottimizzato per documentazione accademica.
            </p>
            <TheoryButton
              topic="Demo Stampa"
              content={{
                title: "Esempio per Stampa",
                category: "Demo",
                overview: "Questo contenuto è ottimizzato per la stampa con layout professionale",
                theory: "Formule e testo vengono formattati per stampa: $$E = mc^2$$",
                keyPoints: ["Layout A4 ottimizzato", "Font leggibili", "Margini appropriati"],
                applications: ["Studio offline", "Presentazioni", "Documentazione"],
                references: [{
                  title: "Student Analyst Documentation",
                  type: "website",
                  url: "https://student-analyst.demo"
                }]
              }}
              className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
            />
          </div>

          {/* External Links */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold mb-3">Collegamenti Esterni</h4>
            <p className="text-sm text-gray-600 mb-3">
              Ogni teoria include links a paper accademici, libri e risorse online.
            </p>
            <TheoryButton
              topic="Demo Links"
              content={{
                title: "Esempio Collegamenti",
                category: "Demo",
                overview: "Esempio di teoria con molti riferimenti esterni",
                theory: "Collegamenti a risorse accademiche autorevoli",
                keyPoints: ["Paper peer-reviewed", "Libri di testo", "Siti istituzionali"],
                applications: ["Ricerca approfondita", "Verifica delle fonti"],
                references: [
                  {
                    title: "Journal of Finance",
                    type: "paper",
                    url: "https://onlinelibrary.wiley.com/journal/15406261",
                    description: "Rivista accademica di finanza"
                  },
                  {
                    title: "Financial Analysts Journal",
                    type: "article", 
                    url: "https://www.tandfonline.com/toc/ufaj20/current",
                    description: "Pubblicazione CFA Institute"
                  }
                ]
              }}
              className="bg-purple-200 hover:bg-purple-300 text-purple-800"
            />
          </div>
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-blue-900 mb-4">Istruzioni d'Uso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Navigazione</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Clicca sul pulsante "?" per aprire la teoria</li>
              <li>• Usa ESC per chiudere il modal</li>
              <li>• Clicca fuori dal modal per chiudere</li>
              <li>• Usa il pulsante "Stampa" per documentazione offline</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Caratteristiche</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Formule LaTeX professionali</li>
              <li>• Riferimenti accademici esterni</li>
              <li>• Layout responsive e accessibile</li>
              <li>• Ottimizzazione per stampa A4</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
} 

