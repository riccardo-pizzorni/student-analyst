import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalysis } from '@/context/AnalysisContext';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface OHLCVData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjustedClose?: number;
}

interface HistoricalTableProps {
    data?: OHLCVData[];
    onSort?: (column: string) => void;
    onFilter?: (filter: string) => void;
    onExport?: (format: 'csv' | 'xlsx') => void;
}

const HistoricalTable: React.FC<HistoricalTableProps> = ({
    data = [],
    onSort,
    onFilter,
    onExport
}) => {
    const { analysisState } = useAnalysis();
    const { analysisResults } = analysisState;
    const { toast } = useToast();

    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Genera dati OHLCV dai risultati dell'analisi
    const tableData = useMemo(() => {
        if (!analysisResults?.historicalData?.datasets || analysisResults.historicalData.datasets.length === 0) {
            return [];
        }

        const labels = analysisResults.historicalData.labels || [];
        const priceDataset = analysisResults.historicalData.datasets.find(d =>
            d.label?.includes('Prezzo') && !d.label?.includes('SMA')
        );

        if (!priceDataset || !priceDataset.data || priceDataset.data.length === 0) {
            return [];
        }

        // Simula dati OHLCV (in una implementazione reale, questi verrebbero dal backend)
        return labels.map((date, index) => ({
            date,
            open: priceDataset.data[index] * 0.99, // Simula open leggermente più basso
            high: priceDataset.data[index] * 1.02, // Simula high leggermente più alto
            low: priceDataset.data[index] * 0.98,  // Simula low leggermente più basso
            close: priceDataset.data[index],
            volume: Math.floor(Math.random() * 1000000) + 100000, // Volume simulato
            adjustedClose: priceDataset.data[index],
        }));
    }, [analysisResults]);

    // Filtra e ordina i dati
    const filteredAndSortedData = useMemo(() => {
        let filtered = tableData;

        // Applica filtro di ricerca
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.close.toString().includes(searchTerm) ||
                item.volume.toString().includes(searchTerm)
            );
        }

        // Applica ordinamento
        filtered.sort((a, b) => {
            let aValue: any = a[sortColumn as keyof OHLCVData];
            let bValue: any = b[sortColumn as keyof OHLCVData];

            // Gestisci ordinamento date
            if (sortColumn === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [tableData, searchTerm, sortColumn, sortDirection]);

    // Calcola paginazione
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

    // Gestione ordinamento
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Gestione export
    const handleExport = (format: 'csv' | 'xlsx') => {
        try {
            const headers = ['Data', 'Open', 'High', 'Low', 'Close', 'Volume', 'Adj Close'];
            const csvContent = [
                headers.join(','),
                ...filteredAndSortedData.map(row => [
                    row.date,
                    row.open.toFixed(2),
                    row.high.toFixed(2),
                    row.low.toFixed(2),
                    row.close.toFixed(2),
                    row.volume.toLocaleString(),
                    row.adjustedClose?.toFixed(2) || row.close.toFixed(2)
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `historical_data_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Export completato",
                description: `Dati esportati in formato ${format.toUpperCase()}`,
            });
        } catch (error) {
            toast({
                title: "Errore nell'export",
                description: "Impossibile esportare i dati. Riprova più tardi.",
                variant: "destructive",
            });
        }
    };

    // Calcola statistiche
    const stats = useMemo(() => {
        if (filteredAndSortedData.length === 0) return null;

        const prices = filteredAndSortedData.map(d => d.close);
        const volumes = filteredAndSortedData.map(d => d.volume);

        return {
            totalRecords: filteredAndSortedData.length,
            avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
            maxPrice: Math.max(...prices),
            minPrice: Math.min(...prices),
            avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        };
    }, [filteredAndSortedData]);

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
                        <path d="M8 3v18" />
                        <path d="M16 3v18" />
                        <path d="M3 8h18" />
                        <path d="M3 16h18" />
                    </svg>
                    Dati Storici OHLCV
                </h3>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleExport('csv')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Statistiche */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Record Totali</div>
                        <div className="text-lg font-bold text-slate-300">{stats.totalRecords}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Prezzo Medio</div>
                        <div className="text-lg font-bold text-blue-400">${stats.avgPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Prezzo Max</div>
                        <div className="text-lg font-bold text-green-400">${stats.maxPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Prezzo Min</div>
                        <div className="text-lg font-bold text-red-400">${stats.minPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-slate-400">Volume Medio</div>
                        <div className="text-lg font-bold text-slate-300">{stats.avgVolume.toLocaleString()}</div>
                    </div>
                </div>
            )}

            {/* Controlli */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <Label htmlFor="search" className="text-sm text-slate-300 mb-2 block">
                        Cerca
                    </Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            id="search"
                            placeholder="Cerca per data, prezzo o volume..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <Label htmlFor="itemsPerPage" className="text-sm text-slate-300 mb-2 block">
                        Record per pagina
                    </Label>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="250">250</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabella */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700">
                            {[
                                { key: 'date', label: 'Data' },
                                { key: 'open', label: 'Open' },
                                { key: 'high', label: 'High' },
                                { key: 'low', label: 'Low' },
                                { key: 'close', label: 'Close' },
                                { key: 'volume', label: 'Volume' },
                                { key: 'adjustedClose', label: 'Adj Close' },
                            ].map(({ key, label }) => (
                                <th
                                    key={key}
                                    className="text-left p-3 text-slate-300 font-medium cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleSort(key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {label}
                                        {sortColumn === key && (
                                            sortDirection === 'asc' ?
                                                <ChevronUp className="w-4 h-4" /> :
                                                <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center p-8 text-slate-400">
                                    Nessun dato disponibile
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                                >
                                    <td className="p-3 text-slate-300">{row.date}</td>
                                    <td className="p-3 text-slate-300">${row.open.toFixed(2)}</td>
                                    <td className="p-3 text-green-400">${row.high.toFixed(2)}</td>
                                    <td className="p-3 text-red-400">${row.low.toFixed(2)}</td>
                                    <td className="p-3 text-slate-300">${row.close.toFixed(2)}</td>
                                    <td className="p-3 text-slate-300">{row.volume.toLocaleString()}</td>
                                    <td className="p-3 text-slate-300">
                                        ${(row.adjustedClose || row.close).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-slate-400">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} di {filteredAndSortedData.length} record
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            Precedente
                        </Button>
                        <span className="flex items-center px-3 text-sm text-slate-300">
                            Pagina {currentPage} di {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Successiva
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalTable; 