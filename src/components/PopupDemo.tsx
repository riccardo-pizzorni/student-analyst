import React, { useState } from 'react';
import { Popup, TextPopup, FormulaPopup, WithPopup } from '@/components/ui/Popup';
import { Button } from '@/components/ui/button';
import { HelpIcon, AnalyticsIcon, TrendingUpIcon, BarChartIcon, SettingsIcon, ShieldIcon } from '@/components/ui/icons';

const PopupDemo: React.FC = () => {
  const [currentExample, setCurrentExample] = useState('basic');

  const examples = [
    { id: 'basic', label: 'Esempi Base' },
    { id: 'financial', label: 'Formule Finanziarie' },
    { id: 'advanced', label: 'Configurazioni Avanzate' },
    { id: 'interactive', label: 'Demo Interattiva' },
  ];

  const financialFormulas = {
    sharpe: {
      formula: `Il Sharpe Ratio misura il rendimento aggiustato per il rischio di un investimento.

$$\\text{Sharpe Ratio} = \\frac{R_p - R_f}{\\sigma_p}$$

Dove:
- $R_p$ = Rendimento del portafoglio
- $R_f$ = Tasso privo di rischio  
- $\\sigma_p$ = Volatilità del portafoglio`,
      explanation: 'Valori sopra 1.0 sono considerati buoni, sopra 2.0 eccellenti. Questo indicatore ti aiuta a capire se stai guadagnando abbastanza per il rischio che stai correndo.'
    },
    
    var: {
      formula: `Il Value at Risk (VaR) stima la perdita massima potenziale in un periodo specifico.

$$\\text{VaR}_{\\alpha} = \\mu + \\sigma \\cdot z_{\\alpha}$$

Per il calcolo Monte Carlo:
$$\\text{VaR} = -\\text{Percentile}_{\\alpha}(\\text{Simulazioni})$$

Dove $\\alpha$ è il livello di confidenza (es. 95%)`,
      explanation: 'Ad esempio, un VaR giornaliero del 5% di €10,000 significa che c\'è una probabilità del 5% di perdere più di €10,000 in un giorno.'
    },

    optimization: {
      formula: `L'ottimizzazione di Markowitz minimizza il rischio per un dato rendimento atteso.

$$\\min_{w} \\quad w^T \\Sigma w$$

Soggetto a:
$$\\sum_{i=1}^{n} w(i) = 1$$
$$\\sum_{i=1}^{n} w(i) \\mu(i) = \\mu_p$$
$$w(i) \\geq 0 \\quad \\forall i$$

Dove $w$ sono i pesi, $\\Sigma$ la matrice di covarianza, $\\mu$ i rendimenti attesi.`,
      explanation: 'Questo è il cuore della moderna teoria del portafoglio. L\'algoritmo trova la combinazione ottimale di asset per minimizzare il rischio.'
    },

    correlation: {
      formula: `La correlazione misura come si muovono insieme due asset.

$$\\rho_{xy} = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\sigma_Y} = \\frac{\\sum_{i=1}^{n}(x(i) - \\bar{x})(y(i) - \\bar{y})}{\\sqrt{\\sum_{i=1}^{n}(x(i) - \\bar{x})^2} \\sqrt{\\sum_{i=1}^{n}(y(i) - \\bar{y})^2}}$$

Valori da -1 a +1:
- $\\rho = +1$: Correlazione perfetta positiva
- $\\rho = 0$: Nessuna correlazione  
- $\\rho = -1$: Correlazione perfetta negativa`,
      explanation: 'Una correlazione bassa tra asset diversifica il rischio. Se un asset cala, l\'altro potrebbe salire, stabilizzando il portafoglio.'
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema Popup Avanzato - Demo Completa
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Popup intelligenti con spiegazioni estese, formule LaTeX professionali, 
          chiusura automatica e navigazione keyboard per analisti finanziari.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {examples.map((example) => (
          <Button
            key={example.id}
            variant={currentExample === example.id ? 'default' : 'outline'}
            onClick={() => setCurrentExample(example.id)}
            className="text-sm"
          >
            {example.label}
          </Button>
        ))}
      </div>

      {/* Esempi Base */}
      {currentExample === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <HelpIcon className="w-5 h-5 text-blue-500" />
              Popup Testo Semplice
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click per una spiegazione dettagliata di concetti base.
            </p>
            
            <div className="space-y-3">
              <TextPopup
                trigger={
                  <button className="text-blue-600 underline hover:text-blue-800">
                    Cos'è la diversificazione?
                  </button>
                }
                title="Diversificazione del Portafoglio"
                text="La diversificazione è una strategia di gestione del rischio che consiste nel combinare diversi investimenti all'interno di un portafoglio. L'idea è che un portafoglio di diversi tipi di investimenti produrrà, in media, rendimenti più elevati e comporterà un rischio inferiore rispetto a qualsiasi singolo investimento presente nel portafoglio."
              />

              <TextPopup
                trigger={
                  <button className="text-green-600 underline hover:text-green-800">
                    Asset allocation
                  </button>
                }
                title="Asset Allocation"
                text="L'asset allocation è una strategia di investimento che mira a bilanciare rischio e rendimento distribuendo gli asset di un portafoglio secondo gli obiettivi dell'individuo, la tolleranza al rischio e l'orizzonte di investimento. Le tre principali classi di asset sono: azioni, obbligazioni e liquidità."
                placement="top"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AnalyticsIcon className="w-5 h-5 text-purple-500" />
              Formule Base
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Formule matematiche renderizzate con LaTeX.
            </p>
            
            <div className="space-y-3">
              <FormulaPopup
                trigger={
                  <button className="text-purple-600 underline hover:text-purple-800">
                    Rendimento semplice
                  </button>
                }
                title="Calcolo Rendimento"
                formula="Il rendimento semplice è: $$R = \\frac{P_1 - P_0}{P_0}$$ dove $P_0$ è il prezzo iniziale e $P_1$ il prezzo finale."
                explanation="Questo è il calcolo più basilare per misurare la performance di un investimento."
              />

              <FormulaPopup
                trigger={
                  <button className="text-orange-600 underline hover:text-orange-800">
                    Media aritmetica
                  </button>
                }
                title="Media dei Rendimenti"
                formula="$$\\bar{R} = \\frac{1}{n} \\sum_{i=1}^{n} R(i)$$ La media aritmetica dei rendimenti storici."
                explanation="Utilizzata per stimare il rendimento atteso futuro basandosi sui dati storici."
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gray-500" />
              Configurazioni UI
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esempi con diverse configurazioni e posizionamenti.
            </p>
            
            <div className="space-y-3">
              <Popup
                trigger={<Button variant="outline" size="sm">Popup senza chiusura X</Button>}
                title="Configurazione Personalizzata"
                content="Questo popup non ha il pulsante X di chiusura. Puoi chiuderlo cliccando fuori o premendo ESC."
                showCloseButton={false}
                placement="left"
              />

              <Popup
                trigger={<Button variant="outline" size="sm">Popup largo</Button>}
                title="Popup con Contenuto Esteso"
                content="Questo popup ha una larghezza massima maggiore per contenuti più estesi come spiegazioni dettagliate di algoritmi complessi o tutorial passo-passo."
                maxWidth="600px"
                placement="right"
              />
            </div>
          </div>
        </div>
      )}

      {/* Formule Finanziarie */}
      {currentExample === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-xl mb-6 text-blue-900">
              📊 Indicatori di Performance
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormulaPopup
                trigger={
                  <div className="bg-white p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUpIcon className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Sharpe Ratio</span>
                    </div>
                    <p className="text-sm text-gray-600">Rendimento / Rischio</p>
                  </div>
                }
                formula={financialFormulas.sharpe.formula}
                explanation={financialFormulas.sharpe.explanation}
                title="Sharpe Ratio - Analisi Rischio/Rendimento"
                maxWidth="500px"
              />

              <FormulaPopup
                trigger={
                  <div className="bg-white p-4 rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldIcon className="w-5 h-5 text-red-500" />
                      <span className="font-medium">Value at Risk</span>
                    </div>
                    <p className="text-sm text-gray-600">Perdita potenziale</p>
                  </div>
                }
                formula={financialFormulas.var.formula}
                explanation={financialFormulas.var.explanation}
                title="Value at Risk (VaR) - Gestione del Rischio"
                maxWidth="500px"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-xl mb-6 text-green-900">
              🎯 Ottimizzazione Portafoglio
            </h3>
            
            <div className="space-y-4">
              <FormulaPopup
                trigger={
                  <div className="bg-white p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChartIcon className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Ottimizzazione Markowitz</span>
                    </div>
                    <p className="text-sm text-gray-600">Minimizzazione del rischio per dato rendimento</p>
                  </div>
                }
                formula={financialFormulas.optimization.formula}
                explanation={financialFormulas.optimization.explanation}
                title="Teoria Moderna del Portafoglio"
                maxWidth="600px"
                placement="left"
              />

              <FormulaPopup
                trigger={
                  <div className="bg-white p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <AnalyticsIcon className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Correlazione</span>
                    </div>
                    <p className="text-sm text-gray-600">Misura del movimento congiunto tra asset</p>
                  </div>
                }
                formula={financialFormulas.correlation.formula}
                explanation={financialFormulas.correlation.explanation}
                title="Analisi della Correlazione"
                maxWidth="550px"
                placement="left"
              />
            </div>
          </div>
        </div>
      )}

      {/* Configurazioni Avanzate */}
      {currentExample === 'advanced' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-xl mb-4">⚙️ Configurazioni Avanzate</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Popup senza chiusura automatica */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Controllo Chiusura</h4>
                <Popup
                  trigger={<Button variant="outline">No chiusura ESC</Button>}
                  title="Popup Persistente"
                  content="Questo popup non si chiude con ESC. Solo cliccando fuori o sul pulsante X."
                  closeOnEscape={false}
                />
                
                <Popup
                  trigger={<Button variant="outline">No chiusura click</Button>}
                  title="Popup Modale"
                  content="Questo popup non si chiude cliccando fuori. Solo ESC o pulsante X."
                  closeOnOutsideClick={false}
                />
              </div>

              {/* Posizionamenti diversi */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Posizionamento</h4>
                {['top', 'bottom', 'left', 'right'].map((placement) => (
                  <Popup
                    key={placement}
                    trigger={<Button variant="outline" size="sm" className="mr-2">
                      {placement.charAt(0).toUpperCase() + placement.slice(1)}
                    </Button>}
                    title={`Popup ${placement}`}
                    content={`Questo popup si posiziona ${placement === 'top' ? 'sopra' : placement === 'bottom' ? 'sotto' : placement === 'left' ? 'a sinistra' : 'a destra'} dell'elemento trigger.`}
                    placement={placement as any}
                  />
                ))}
              </div>

              {/* Dimensioni diverse */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Dimensioni</h4>
                <Popup
                  trigger={<Button variant="outline">Piccolo</Button>}
                  title="Popup Compatto"
                  content="Popup con larghezza ridotta per informazioni brevi."
                  maxWidth="250px"
                />
                
                <Popup
                  trigger={<Button variant="outline">Grande</Button>}
                  title="Popup Esteso"
                  content="Popup con larghezza maggiore per contenuti estesi come spiegazioni dettagliate, tutorial, documentazione tecnica o formule complesse con più passaggi."
                  maxWidth="700px"
                />
              </div>
            </div>
          </div>

          {/* Popup con contenuto misto */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-xl mb-4">🎨 Contenuto Misto LaTeX + Testo</h3>
            
            <FormulaPopup
              trigger={<Button>Esempio Complesso: CAPM</Button>}
              title="Capital Asset Pricing Model (CAPM)"
              formula={`Il CAPM descrive la relazione tra rischio sistematico e rendimento atteso.

$$E(R(i)) = R_f + \\beta(i) (E(R_m) - R_f)$$

Dove:
- $E(R(i))$ = Rendimento atteso dell'asset $i$
- $R_f$ = Tasso risk-free
- $\\beta(i)$ = Beta dell'asset (sensibilità al mercato)
- $E(R_m)$ = Rendimento atteso del mercato
- $(E(R_m) - R_f)$ = Premio per il rischio di mercato

Il Beta è calcolato come:
$$\\beta(i) = \\frac{\\text{Cov}(R(i), R_m)}{\\text{Var}(R_m)}$$`}
              explanation="Il CAPM è uno dei modelli più utilizzati in finanza per determinare il rendimento teoricamente appropriato di un asset. Un beta di 1.0 indica che l'asset si muove con il mercato, mentre beta > 1.0 indica maggiore volatilità."
              maxWidth="600px"
              placement="auto"
            />
          </div>
        </div>
      )}

      {/* Demo Interattiva */}
      {currentExample === 'interactive' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-xl mb-6">🚀 Test Interattivo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium mb-4">Test di Navigazione Keyboard</h4>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Prova la navigazione con la tastiera:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <kbd className="px-2 py-1 bg-gray-200 rounded">ESC</kbd> - Chiude il popup</li>
                  <li>• <kbd className="px-2 py-1 bg-gray-200 rounded">Tab</kbd> - Naviga tra elementi</li>
                  <li>• <kbd className="px-2 py-1 bg-gray-200 rounded">Shift+Tab</kbd> - Naviga indietro</li>
                  <li>• Click fuori - Chiude il popup</li>
                </ul>
                
                <Popup
                  trigger={<Button>Apri Test Keyboard</Button>}
                  title="Test Navigazione"
                  maxWidth="400px"
                >
                  <div className="space-y-3">
                    <p className="text-sm">Prova a navigare con Tab e Shift+Tab:</p>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline">Pulsante 1</Button>
                      <Button size="sm" variant="outline">Pulsante 2</Button>
                      <input 
                        type="text" 
                        placeholder="Campo di input"
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                      <Button size="sm">Pulsante Finale</Button>
                    </div>
                  </div>
                </Popup>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Test Posizionamento Edge Cases</h4>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Clicca vicino ai bordi dello schermo per testare il posizionamento intelligente:
                </p>
                
                <div className="grid grid-cols-3 gap-2 h-32 relative">
                  {/* Angoli e bordi */}
                  <Popup
                    trigger={<Button size="sm" className="absolute top-0 left-0">↖️</Button>}
                    title="Angolo in alto a sinistra"
                    content="Il sistema dovrebbe posizionare questo popup in modo che sia completamente visibile."
                    placement="auto"
                  />
                  
                  <Popup
                    trigger={<Button size="sm" className="absolute top-0 right-0">↗️</Button>}
                    title="Angolo in alto a destra"
                    content="Test del posizionamento automatico quando il popup non ha spazio sulla destra."
                    placement="auto"
                  />
                  
                  <Popup
                    trigger={<Button size="sm" className="absolute bottom-0 left-0">↙️</Button>}
                    title="Angolo in basso a sinistra"
                    content="Verifica che il popup non esca fuori dai bordi dello schermo."
                    placement="auto"
                  />
                  
                  <Popup
                    trigger={<Button size="sm" className="absolute bottom-0 right-0">↘️</Button>}
                    title="Angolo in basso a destra"
                    content="Il posizionamento dovrebbe adattarsi automaticamente per rimanere visibile."
                    placement="auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer con istruzioni */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Suggerimenti per l'Utilizzo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Controlli Keyboard:</h4>
            <ul className="space-y-1">
              <li>• ESC chiude qualsiasi popup aperto</li>
              <li>• Tab/Shift+Tab per navigare tra elementi</li>
              <li>• Enter per attivare pulsanti</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Personalizzazione:</h4>
            <ul className="space-y-1">
              <li>• Modifica posizionamento con placement prop</li>
              <li>• Controlla chiusura con closeOnEscape/closeOnOutsideClick</li>
              <li>• Adatta dimensioni con maxWidth</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupDemo; 

