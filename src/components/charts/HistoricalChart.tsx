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
        <div className="dark-card rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
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
                        className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-colors"
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
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                        </svg>
                        Info
                    </button>
                </div>
            </div>

            {/* Messaggio warning per serie incomplete */}
            {/* FALLBACK: Serie che si interrompono prima della fine del periodo */}
            {/* MESSAGGIO: Guida l'utente a verificare la copertura storica */}
            {incompleteSeries.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-900/60 text-yellow-200 rounded-lg text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-yellow-300"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Attenzione: dati disponibili solo fino a una certa data per {incompleteSeries.join(', ')}. Verifica la copertura storica del titolo.
                </div>
            )}

            {/* Messaggio per ticker mancanti */}
            {/* FALLBACK: Ticker richiesti ma non trovati nei dati */}
            {/* MESSAGGIO: Guida l'utente a verificare simbolo o periodo */}
            {missingTickers.length > 0 && (
                <div className="mb-4 p-3 bg-orange-900/60 text-orange-200 rounded-lg text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-orange-300"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Ticker {missingTickers.join(', ')} non ha dati disponibili per il periodo selezionato. Verifica il simbolo o prova un periodo diverso.
                </div>
            )}

            {/* Messaggio per buchi temporali significativi */}
            {/* FALLBACK: Serie con più del 20% di punti null */}
            {/* MESSAGGIO: Spiega possibili cause (IPO, merge, cambio simbolo) */}
            {hasTemporalGaps && (
                <div className="mb-4 p-3 bg-blue-900/60 text-blue-200 rounded-lg text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-300"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Rilevati buchi temporali significativi nei dati. Potrebbe essere dovuto a IPO recente, merge aziendale o cambio di simbolo.
                </div>
            )}

            {/* Statistiche rapide */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Prezzo Iniziale</div>
                        <div className="text-lg font-bold text-green-400">${stats.firstPrice}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Prezzo Attuale</div>
                        <div className="text-lg font-bold text-blue-400">${stats.lastPrice}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Variazione</div>
                        <div className={`text-lg font-bold ${stats.changePercent.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                            {stats.changePercent}%
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Punti Dati</div>
                        <div className="text-lg font-bold text-slate-300">{stats.dataPoints}</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="sma20"
                        checked={showSMA20}
                        onCheckedChange={setShowSMA20}
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
                    />
                    <Label htmlFor="sma200" className="text-sm text-slate-300">
                        SMA 200
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="rsi" checked={showRSI} onCheckedChange={setShowRSI} />
                    <Label htmlFor="rsi" className="text-sm text-slate-300">
                        RSI
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="volume"
                        checked={showVolume}
                        onCheckedChange={setShowVolume}
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
                    />
                    <Label htmlFor="macd" className="text-sm text-slate-300">
                        MACD
                    </Label>
                </div>
            </div>

            <div className="w-full h-96">
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

            {/* Legenda interattiva */}
            {analysisResults?.metadata && (
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Informazioni Analisi</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                        <div>
                            <span className="font-medium">Simboli:</span> {analysisResults.metadata.symbols.join(', ')}
                        </div>
                        <div>
                            <span className="font-medium">Periodo:</span> {analysisResults.metadata.period.start} - {analysisResults.metadata.period.end}
                        </div>
                        <div>
                            <span className="font-medium">Frequenza:</span> {analysisResults.metadata.frequency}
                        </div>
                        <div>
                            <span className="font-medium">Punti Dati:</span> {analysisResults.metadata.dataPoints}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalChart;
