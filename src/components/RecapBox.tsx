import React from 'react';
import { Star, TrendingUp, Award, CheckCircle } from 'lucide-react';

export default function RecapBox({ activeStep }: { activeStep: string }) {
  const stepRecaps = {
    input: {
      title: 'Dati Validati con Successo!',
      description:
        "Hai completato la validazione dei dati. I tuoi dataset sono ora pronti per l'analisi professionale.",
      tips: 'Tip: Dataset puliti = risultati affidabili. Hai fatto il primo passo fondamentale!',
    },
    storica: {
      title: 'Analisi Storica Completata!',
      description:
        'Hai esplorato le performance storiche e identificato i trend principali dei tuoi titoli.',
      tips: 'Tip: Le performance passate informano ma non garantiscono risultati futuri.',
    },
    performance: {
      title: 'Metriche di Performance Calcolate!',
      description:
        'Hai calcolato Sharpe Ratio, CAGR e altre metriche chiave per valutare la qualità dei rendimenti.',
      tips: 'Tip: Un Sharpe Ratio > 1 indica buona performance risk-adjusted.',
    },
    rischio: {
      title: 'Profilo di Rischio Definito!',
      description:
        'Hai quantificato volatilità, VaR e drawdown per comprendere i rischi del portafoglio.',
      tips: 'Tip: Diversificazione intelligente riduce il rischio senza sacrificare rendimento.',
    },
    fondamentale: {
      title: 'Analisi Fondamentale Conclusa!',
      description:
        'Hai valutato multipli, redditività e qualità dei bilanci per una visione completa.',
      tips: 'Tip: Combina sempre analisi tecnica e fondamentale per decisioni migliori.',
    },
    ottimizzazione: {
      title: 'Portafoglio Ottimizzato!',
      description:
        "Hai costruito la frontiera efficiente e trovato l'allocazione ottimale del capitale.",
      tips: "Tip: Riequilibra periodicamente per mantenere l'ottimizzazione nel tempo.",
    },
    strategie: {
      title: 'Strategie Testate!',
      description:
        'Hai eseguito backtest completi e valutato la validità delle strategie quantitative.',
      tips: "Tip: Attenzione all'overfitting - valida sempre out-of-sample.",
    },
    output: {
      title: 'Report Professionale Generato!',
      description:
        "Hai completato l'analisi completa e generato un report professionale esportabile.",
      tips: 'Tip: Documenta sempre metodologie e assunzioni per trasparenza.',
    },
  };

  const currentRecap =
    stepRecaps[activeStep as keyof typeof stepRecaps] || stepRecaps.input;

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 border-l-4 border-yellow-400 rounded-xl p-6 mt-6 shadow-lg animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Star size={24} className="text-white animate-pulse" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-xl text-yellow-800">
              {currentRecap.title}
            </h3>
            <CheckCircle size={20} className="text-green-600" />
          </div>

          <p className="text-yellow-800 leading-relaxed">
            {currentRecap.description}
          </p>

          <div className="bg-yellow-100/50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start gap-2">
              <TrendingUp
                size={16}
                className="text-yellow-600 mt-0.5 flex-shrink-0"
              />
              <p className="text-sm text-yellow-700 font-medium">
                {currentRecap.tips}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-800 font-medium transition-colors">
              <Award size={16} />
              Approfondisci nel Glossario
            </button>
            <button className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
              <span className="text-purple-500">✨</span>
              Chiedi a Lovable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
