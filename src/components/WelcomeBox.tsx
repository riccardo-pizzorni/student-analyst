import { TrendingUp } from 'lucide-react';

export default function WelcomeBox({ activeStep }: { activeStep: string }) {
  const getStepInfo = (step: string) => {
    switch (step) {
      case 'input':
        return {
          title: 'Input & Validazione',
          subtitle: 'Caricamento e controllo dati',
        };
      case 'storica':
        return {
          title: 'Analisi Storica',
          subtitle: 'Analisi delle performance passate',
        };
      case 'performance':
        return {
          title: 'Performance',
          subtitle: 'Metriche di rendimento',
        };
      case 'rischio':
        return {
          title: 'Volatilità & Rischio',
          subtitle: 'Analisi del rischio',
        };
      case 'diversificazione':
        return {
          title: 'Inter-Asset',
          subtitle: 'Correlazioni e diversificazione',
        };
      case 'fondamentale':
        return {
          title: 'Fondamentale',
          subtitle: 'Analisi fondamentale',
        };
      case 'ottimizzazione':
        return {
          title: 'Ottimizzazione',
          subtitle: 'Ottimizzazione del portafoglio',
        };
      case 'strategie':
        return {
          title: 'Strategie',
          subtitle: 'Strategie di investimento',
        };
      case 'regressiva':
        return {
          title: 'Analisi Regressiva',
          subtitle: 'Modelli econometrici',
        };
      default:
        return {
          title: 'Student Analyst',
          subtitle: 'Professional Financial Analysis',
        };
    }
  };

  const stepInfo = getStepInfo(activeStep);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-950/30 rounded-2xl"></div>

      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <TrendingUp size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-300 mb-2">
              {stepInfo.title}
            </h1>
            <p className="text-slate-400 text-lg">{stepInfo.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
