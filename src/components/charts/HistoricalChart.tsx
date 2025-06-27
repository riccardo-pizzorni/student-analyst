import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import {
    BarElement,
    CategoryScale,
    ChartDataset,
    Chart as ChartJS,
    ChartOptions,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Registra i componenti necessari di Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

// Interfacce TypeScript per type safety
interface HistoricalData {
    labels: string[];
    datasets: ChartDataset<'line', number[]>[];
}

interface HistoricalResults {
    historicalData?: HistoricalData;
}

const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index' as const,
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                color: 'rgb(203, 213, 225)',
                usePointStyle: true,
                padding: 20,
                generateLabels: (chart) => {
                    const datasets = chart.data.datasets;
                    return datasets.map((dataset, index) => {
                        const meta = chart.getDatasetMeta(index);
                        const hasGaps = dataset.data && dataset.data.filter(v => v === null).length > dataset.data.length * 0.1;
                        const label = dataset.label || `Dataset ${index}`;
                        return {
                            text: hasGaps ? `⚠️ ${label}` : label,
                            fillStyle: dataset.borderColor as string,
                            strokeStyle: dataset.borderColor as string,
                            lineWidth: 2,
                            pointStyle: 'circle',
                            hidden: meta.hidden,
                            index: index,
                            datasetIndex: index,
                        };
                    });
                },
            },
            onClick: (e, legendItem, legend) => {
                // Toggle dataset visibility
                const index = legendItem.index;
                const ci = legend.chart;
                const meta = ci.getDatasetMeta(index!);
                meta.hidden = !meta.hidden;
                ci.update();
            },
        },
        tooltip: {
            mode: 'index' as const,
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: 'rgb(203, 213, 225)',
            bodyColor: 'rgb(203, 213, 225)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
                title: (context) => {
                    const date = new Date(context[0].label);
                    return date.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                },
                label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;
                    if (value === null || value === undefined || isNaN(value)) {
                        return `${label}: Dato mancante`;
                    }
                    if (label.includes('RSI')) {
                        return `${label}: ${Number(value).toFixed(2)}`;
                    } else if (label.includes('Volume')) {
                        return `${label}: ${Number(value).toLocaleString()}`;
                    } else {
                        return `${label}: $${Number(value).toFixed(2)}`;
                    }
                },
            },
        },
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true,
                },
                mode: 'xy',
            },
            pan: {
                enabled: true,
                mode: 'xy',
            },
        },
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
                color: 'rgb(203, 213, 225)',
                maxRotation: 45,
            },
        },
        y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            grid: {
                color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
                color: 'rgb(203, 213, 225)',
                callback: (value) => `$${Number(value).toFixed(2)}`,
            },
        },
        y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            grid: {
                drawOnChartArea: false,
            },
            ticks: {
                color: 'rgb(203, 213, 225)',
                callback: (value) => `${Number(value).toFixed(0)}`,
            },
            min: 0,
            max: 100,
        },
    },
};

type LineDataset = ChartDataset<'line', number[]>;
type BarDataset = ChartDataset<'bar', number[]>;
type _MixedDataset = LineDataset | BarDataset;

const HistoricalChart = () => {
    const { analysisState, startAnalysis } = useAnalysis();
    const { isLoading, error, analysisResults } = analysisState;
    const { toast } = useToast();

    const [showSMA20, setShowSMA20] = useState(true);
    const [showSMA50, setShowSMA50] = useState(true);
    const [showSMA200, setShowSMA200] = useState(true);
    const [showRSI, setShowRSI] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [showBollinger, setShowBollinger] = useState(false);
    const [showMACD, setShowMACD] = useState(false);

    // Funzioni per gestire i click sui bottoni
    const handleRefreshClick = async () => {
        try {
            toast({
                title: "Aggiornamento dati",
                description: "Aggiornamento dei dati storici in corso...",
            });

            await startAnalysis();

            toast({
                title: "Aggiornamento completato",
                description: "I dati storici sono stati aggiornati con successo.",
            });
        } catch (error) {
            toast({
                title: "Errore nell'aggiornamento",
                description: "Impossibile aggiornare i dati storici. Riprova più tardi.",
                variant: "destructive",
            });
        }
    };

    const handleInfoClick = () => {
        toast({
            title: "Informazioni sul grafico",
            description: "Questo grafico mostra l'andamento storico dei prezzi con indicatori tecnici. Usa gli switch per mostrare/nascondere indicatori. Puoi zoomare e fare pan sul grafico.",
        });
    };

    // Fallback robusti per i dati del grafico
    const rawChartData: HistoricalData = {
        labels: analysisResults?.historicalData?.labels || [],
        datasets: analysisResults?.historicalData?.datasets || [],
    };

    // Filtra i dataset in base agli switch attivi
    const filteredDatasets = useMemo(() => {
        if (!rawChartData.datasets || rawChartData.datasets.length === 0) {
            return [];
        }

        return rawChartData.datasets.filter((dataset) => {
            const label = dataset.label?.toLowerCase() || '';

            // Gestione indicatori tecnici
            if (label.includes('sma20') || label.includes('20')) return showSMA20;
            if (label.includes('sma50') || label.includes('50')) return showSMA50;
            if (label.includes('sma200') || label.includes('200')) return showSMA200;
            if (label.includes('rsi')) return showRSI;
            if (label.includes('volume')) return showVolume;
            if (label.includes('bollinger')) return showBollinger;
            if (label.includes('macd')) return showMACD;

            // Mostra sempre i dataset principali (prezzi, portafoglio, ecc.)
            return true;
        });
    }, [rawChartData.datasets, showSMA20, showSMA50, showSMA200, showRSI, showVolume, showBollinger, showMACD]);

    // Calcola ticker con dati interrotti (es. ultimi punti null)
    // FALLBACK: Se una serie ha null negli ultimi 5 punti, viene considerata incompleta
    // EDGE CASE: Gestisce ticker che si fermano prima della fine del periodo (es. META al 2013)
    const incompleteSeries = useMemo(() => {
        if (!filteredDatasets || filteredDatasets.length === 0) return [];
        return filteredDatasets
            .filter(ds => {
                if (!ds.data || ds.data.length === 0) return false;
                // Se almeno uno degli ultimi 5 punti è null, consideriamo la serie interrotta
                const lastPoints = ds.data.slice(-5);
                return lastPoints.some(v => v === null);
            })
            .map(ds => ds.label || '');
    }, [filteredDatasets]);

    // Calcola ticker richiesti ma non presenti nei risultati
    // FALLBACK: Confronta ticker richiesti con quelli effettivamente disponibili
    // EDGE CASE: Gestisce ticker non trovati, simboli errati, o periodi senza dati
    const missingTickers = useMemo(() => {
        if (!analysisResults?.metadata?.symbols || !filteredDatasets || filteredDatasets.length === 0) return [];
        const availableTickers = filteredDatasets
            .filter(ds => ds.label?.includes(' - Prezzo'))
            .map(ds => ds.label?.split(' - ')[0] || '');
        return analysisResults.metadata.symbols.filter(ticker => !availableTickers.includes(ticker));
    }, [analysisResults?.metadata?.symbols, filteredDatasets]);

    // Calcola se ci sono buchi temporali significativi (IPO, merge, ecc.)
    // FALLBACK: Se più del 20% dei punti sono null, considera buchi significativi
    // EDGE CASE: Gestisce IPO recenti, merge aziendali, cambi di simbolo
    const hasTemporalGaps = useMemo(() => {
        if (!filteredDatasets || filteredDatasets.length === 0) return false;
        return filteredDatasets.some(ds => {
            if (!ds.data || ds.data.length === 0) return false;
            // Se più del 20% dei punti sono null, consideriamo buchi significativi
            const nullCount = ds.data.filter(v => v === null).length;
            return nullCount > ds.data.length * 0.2;
        });
    }, [filteredDatasets]);

    const chartData = {
        labels: rawChartData.labels,
        datasets: filteredDatasets.map(ds => ({
            ...ds,
            spanGaps: true, // Attiva linee spezzate tra i buchi
        })),
    };

    // Calcola statistiche per il tooltip informativo
    const getChartStats = () => {
        if (!analysisResults?.historicalData?.datasets || analysisResults.historicalData.datasets.length === 0) {
            return null;
        }
        const priceDataset = analysisResults.historicalData.datasets.find(d =>
            d.label?.includes('Prezzo') && !d.label?.includes('SMA')
        );
        if (!priceDataset || !priceDataset.data || priceDataset.data.length === 0) {
            return null;
        }
        // Fallback robusto: trova il primo e ultimo valore non null
        const prices = priceDataset.data.filter(v => v !== null && v !== undefined && !isNaN(Number(v)));
        if (prices.length === 0) return null;
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const change = lastPrice - firstPrice;
        const changePercent = firstPrice !== 0 ? (change / firstPrice) * 100 : 0;
        return {
            firstPrice: Number(firstPrice).toFixed(2),
            lastPrice: Number(lastPrice).toFixed(2),
            change: Number(change).toFixed(2),
            changePercent: Number(changePercent).toFixed(2),
            dataPoints: prices.length,
        };
    };

    const stats = getChartStats();

    return (
        <div className="dark-card rounded-xl p-8 space-y-6">
            {/* SEZIONE 1: Header e Controlli Principali */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h3 className="text-xl font-bold text-blue-300 flex items-center gap-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 3v18h18" />
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                    </svg>
                    Andamento Storico
                    {stats && (
                        <span className="text-sm font-normal text-slate-400">
                            ({stats.changePercent}% | {stats.dataPoints} punti)
                        </span>
                    )}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefreshClick}
                        disabled={isLoading}
                        aria-label="Aggiorna dati storici"
                        className="flex items-center gap-2 text-sm px-3 py-2 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={isLoading ? "animate-spin" : ""}
                            aria-hidden="true"
                        >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                        </svg>
                        {isLoading ? "Aggiornamento..." : "Aggiorna"}
                    </button>
                    <button
                        onClick={handleInfoClick}
                        aria-label="Informazioni sul grafico"
                        className="flex items-center gap-2 text-sm px-3 py-2 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                        </svg>
                        Info
                    </button>
                </div>
            </div>

            {/* SEZIONE 2: Messaggi e Warning Raggruppati */}
            {(incompleteSeries.length > 0 || missingTickers.length > 0 || hasTemporalGaps) && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Avvisi e Informazioni
                    </h4>

                    {/* Messaggio warning per serie incomplete */}
                    {incompleteSeries.length > 0 && (
                        <div className="p-3 bg-yellow-900/60 text-yellow-200 rounded-lg text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-yellow-300" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Attenzione: dati disponibili solo fino a una certa data per <strong>{incompleteSeries.join(', ')}</strong>. Verifica la copertura storica del titolo.</span>
                        </div>
                    )}

                    {/* Messaggio per ticker mancanti */}
                    {missingTickers.length > 0 && (
                        <div className="p-3 bg-orange-900/60 text-orange-200 rounded-lg text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-orange-300" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Ticker <strong>{missingTickers.join(', ')}</strong> non ha dati disponibili per il periodo selezionato. Verifica il simbolo o prova un periodo diverso.</span>
                        </div>
                    )}

                    {/* Messaggio per buchi temporali significativi */}
                    {hasTemporalGaps && (
                        <div className="p-3 bg-blue-900/60 text-blue-200 rounded-lg text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-300" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Rilevati buchi temporali significativi nei dati. Potrebbe essere dovuto a IPO recente, merge aziendale o cambio di simbolo.</span>
                        </div>
                    )}
                </div>
            )}

            {/* SEZIONE 3: Info Analisi */}
            {analysisResults?.metadata && (
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Informazioni Analisi
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-400">
                        <div>
                            <span className="font-medium text-slate-300">Simboli:</span>
                            <div className="mt-1">{analysisResults.metadata.symbols.join(', ')}</div>
                        </div>
                        <div>
                            <span className="font-medium text-slate-300">Periodo:</span>
                            <div className="mt-1">{analysisResults.metadata.period.start} - {analysisResults.metadata.period.end}</div>
                        </div>
                        <div>
                            <span className="font-medium text-slate-300">Frequenza:</span>
                            <div className="mt-1">{analysisResults.metadata.frequency}</div>
                        </div>
                        <div>
                            <span className="font-medium text-slate-300">Punti Dati:</span>
                            <div className="mt-1">{analysisResults.metadata.dataPoints}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEZIONE 4: Statistiche Rapide */}
            {stats && (
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-green-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Statistiche Performance
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-400 mb-1">Prezzo Iniziale</div>
                            <div className="text-lg font-bold text-green-400">${stats.firstPrice}</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-400 mb-1">Prezzo Attuale</div>
                            <div className="text-lg font-bold text-blue-400">${stats.lastPrice}</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-400 mb-1">Variazione</div>
                            <div className={`text-lg font-bold ${stats.changePercent.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                                {stats.changePercent}%
                            </div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-400 mb-1">Punti Dati</div>
                            <div className="text-lg font-bold text-slate-300">{stats.dataPoints}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEZIONE 5: Controlli Indicatori */}
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Controlli Indicatori
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="sma20"
                            checked={showSMA20}
                            onCheckedChange={setShowSMA20}
                            aria-label="Mostra/nascondi SMA 20"
                        />
                        <Label htmlFor="sma20" className="text-sm text-slate-300">
                            SMA 20
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="sma50"
                            checked={showSMA50}
                            onCheckedChange={setShowSMA50}
                            aria-label="Mostra/nascondi SMA 50"
                        />
                        <Label htmlFor="sma50" className="text-sm text-slate-300">
                            SMA 50
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="sma200"
                            checked={showSMA200}
                            onCheckedChange={setShowSMA200}
                            aria-label="Mostra/nascondi SMA 200"
                        />
                        <Label htmlFor="sma200" className="text-sm text-slate-300">
                            SMA 200
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="rsi"
                            checked={showRSI}
                            onCheckedChange={setShowRSI}
                            aria-label="Mostra/nascondi RSI"
                        />
                        <Label htmlFor="rsi" className="text-sm text-slate-300">
                            RSI
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="volume"
                            checked={showVolume}
                            onCheckedChange={setShowVolume}
                            aria-label="Mostra/nascondi Volume"
                        />
                        <Label htmlFor="volume" className="text-sm text-slate-300">
                            Volume
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="bollinger"
                            checked={showBollinger}
                            onCheckedChange={setShowBollinger}
                            aria-label="Mostra/nascondi Bande di Bollinger"
                        />
                        <Label htmlFor="bollinger" className="text-sm text-slate-300">
                            Bollinger
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="macd"
                            checked={showMACD}
                            onCheckedChange={setShowMACD}
                            aria-label="Mostra/nascondi MACD"
                        />
                        <Label htmlFor="macd" className="text-sm text-slate-300">
                            MACD
                        </Label>
                    </div>
                </div>
            </div>

            {/* SEZIONE 6: Grafico */}
            <div className="w-full h-96 bg-slate-800/20 rounded-lg border border-slate-700/50 p-4">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <p className="text-blue-300">Caricamento dati in corso...</p>
                            {/* FALLBACK: Messaggio aggiornato per riflettere la fonte dati attuale */}
                            <p className="text-sm text-slate-400">Recupero dati storici da Yahoo Finance</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-red-500"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {/* FALLBACK: Mostra errore specifico + azione di recovery */}
                            <p className="text-red-300">{error}</p>
                            <button
                                onClick={handleRefreshClick}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Riprova
                            </button>
                        </div>
                    </div>
                ) : !analysisResults ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-blue-400 mx-auto"
                                aria-hidden="true"
                            >
                                <path d="M3 3v18h18" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                            {/* FALLBACK: Nessuna analisi eseguita + guida all'azione */}
                            <h4 className="text-xl font-bold text-slate-200">
                                Nessuna Analisi Eseguita
                            </h4>
                            <p className="text-slate-400">
                                Vai alla sezione 'Input & Validazione' per avviare una nuova
                                analisi.
                            </p>
                        </div>
                    </div>
                ) : !rawChartData.labels || rawChartData.labels.length === 0 || !filteredDatasets || filteredDatasets.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-blue-400 mx-auto"
                                aria-hidden="true"
                            >
                                <path d="M3 3v18h18" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                            {/* FALLBACK: Dati vuoti dopo analisi + guida all'azione */}
                            <h4 className="text-xl font-bold text-slate-200">
                                Nessun Dato Storico Disponibile
                            </h4>
                            <p className="text-slate-400">
                                Avvia un'analisi per visualizzare l'andamento storico dei prezzi.
                            </p>
                        </div>
                    </div>
                ) : (
                    <Line data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default HistoricalChart;
