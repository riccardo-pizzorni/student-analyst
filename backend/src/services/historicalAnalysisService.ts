import {
  AlphaVantageService,
  AlphaVantageTimeframe,
  OHLCVData,
} from './alphaVantageService';

/**
 * Interface per i dati storici processati
 */
export interface ProcessedHistoricalData {
  symbol: string;
  dates: string[];
  prices: {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    adjustedClose: number[];
    volume: number[];
  };
  returns: {
    daily: number[];
    cumulative: number[];
    logReturns: number[];
  };
  technicalIndicators: {
    sma20: number[];
    sma50: number[];
    sma200: number[];
    rsi: number[];
    bollingerBands: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
    macd: {
      macd: number[];
      signal: number[];
      histogram: number[];
    };
  };
  performanceMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    calmarRatio: number;
  };
}

/**
 * Interface per i parametri di analisi storica
 */
export interface HistoricalAnalysisParams {
  tickers: string[];
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  includeTechnicalIndicators?: boolean;
  includePerformanceMetrics?: boolean;
}

/**
 * Interface per la risposta dell'analisi storica
 */
export interface HistoricalAnalysisResponse {
  success: boolean;
  data: {
    historicalData: ProcessedHistoricalData[];
    portfolioData?: {
      dates: string[];
      portfolioValue: number[];
      portfolioReturns: number[];
      portfolioMetrics: {
        totalReturn: number;
        annualizedReturn: number;
        volatility: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
    };
    marketPhases?: {
      bullMarkets: Array<{
        start: string;
        end: string;
        duration: number;
        return: number;
      }>;
      bearMarkets: Array<{
        start: string;
        end: string;
        duration: number;
        return: number;
      }>;
      consolidation: Array<{ start: string; end: string; duration: number }>;
    };
  };
  metadata: {
    analysisDate: string;
    symbols: string[];
    period: { start: string; end: string };
    frequency: string;
    dataPoints: number;
    processingTime: number;
  };
  error?: string;
}

/**
 * Classe per l'analisi storica avanzata
 */
export class HistoricalAnalysisService {
  private alphaVantageService: AlphaVantageService;

  constructor() {
    this.alphaVantageService = new AlphaVantageService();
  }

  /**
   * Funzione principale per eseguire l'analisi storica
   */
  public async performHistoricalAnalysis(
    params: HistoricalAnalysisParams
  ): Promise<HistoricalAnalysisResponse> {
    const startTime = Date.now();

    try {
      console.log('🚀 Avvio analisi storica per:', params.tickers);

      // 1. Fetch dati storici per ogni ticker
      const historicalDataPromises = params.tickers.map(ticker =>
        this.fetchHistoricalData(
          ticker,
          params.startDate,
          params.endDate,
          params.frequency
        )
      );

      const historicalDataResults = await Promise.allSettled(
        historicalDataPromises
      );

      // 2. Filtra i risultati riusciti
      const successfulData = historicalDataResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return { ticker: params.tickers[index], data: result.value };
          } else {
            console.error(
              `❌ Errore nel fetch dati per ${params.tickers[index]}:`,
              result.reason
            );
            return null;
          }
        })
        .filter(item => item !== null) as Array<{
        ticker: string;
        data: OHLCVData[];
      }>;

      if (successfulData.length === 0) {
        throw new Error('Nessun dato valido ottenuto per i ticker richiesti');
      }

      // 3. Processa i dati storici
      const processedData = await Promise.all(
        successfulData.map(async ({ ticker, data }) => {
          return this.processHistoricalData(ticker, data, params);
        })
      );

      // 4. Calcola dati del portafoglio se ci sono più ticker
      let portfolioData = undefined;
      if (processedData.length > 1) {
        portfolioData = this.calculatePortfolioData(processedData);
      }

      // 5. Identifica fasi di mercato
      const marketPhases = this.identifyMarketPhases(processedData[0]);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          historicalData: processedData,
          portfolioData,
          marketPhases,
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          symbols: params.tickers,
          period: { start: params.startDate, end: params.endDate },
          frequency: params.frequency,
          dataPoints: processedData.reduce(
            (sum, data) => sum + data.dates.length,
            0
          ),
          processingTime,
        },
      };
    } catch (error) {
      console.error("❌ Errore durante l'analisi storica:", error);
      return {
        success: false,
        data: { historicalData: [] },
        metadata: {
          analysisDate: new Date().toISOString(),
          symbols: params.tickers,
          period: { start: params.startDate, end: params.endDate },
          frequency: params.frequency,
          dataPoints: 0,
          processingTime: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      };
    }
  }

  /**
   * Fetch dati storici da Alpha Vantage
   */
  private async fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string,
    frequency: string
  ): Promise<OHLCVData[]> {
    const timeframe = this.mapFrequencyToTimeframe(frequency);

    const response = await this.alphaVantageService.getStockData(
      symbol,
      timeframe,
      {
        outputSize: 'full',
        adjusted: true,
      }
    );

    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error(`Nessun dato disponibile per ${symbol}`);
    }

    // Filtra i dati per il periodo richiesto
    const filteredData = response.data.filter(item => {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    });

    if (filteredData.length === 0) {
      throw new Error(
        `Nessun dato disponibile per ${symbol} nel periodo specificato`
      );
    }

    // Ordina per data crescente
    return filteredData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Mappa la frequenza ai timeframe di Alpha Vantage
   */
  private mapFrequencyToTimeframe(frequency: string): AlphaVantageTimeframe {
    switch (frequency) {
      case 'daily':
        return AlphaVantageTimeframe.DAILY;
      case 'weekly':
        return AlphaVantageTimeframe.WEEKLY;
      case 'monthly':
        return AlphaVantageTimeframe.MONTHLY;
      default:
        return AlphaVantageTimeframe.DAILY;
    }
  }

  /**
   * Processa i dati storici e calcola indicatori tecnici
   */
  private async processHistoricalData(
    symbol: string,
    data: OHLCVData[],
    params: HistoricalAnalysisParams
  ): Promise<ProcessedHistoricalData> {
    const dates = data.map(item => item.date);
    const prices = {
      open: data.map(item => item.open),
      high: data.map(item => item.high),
      low: data.map(item => item.low),
      close: data.map(item => item.close),
      adjustedClose: data.map(item => item.adjustedClose || item.close),
      volume: data.map(item => item.volume),
    };

    // Calcola i rendimenti
    const returns = this.calculateReturns(prices.adjustedClose);

    // Calcola indicatori tecnici
    const technicalIndicators =
      params.includeTechnicalIndicators !== false
        ? this.calculateTechnicalIndicators(prices.adjustedClose, prices.volume)
        : {
            sma20: [],
            sma50: [],
            sma200: [],
            rsi: [],
            bollingerBands: { upper: [], middle: [], lower: [] },
            macd: { macd: [], signal: [], histogram: [] },
          };

    // Calcola metriche di performance
    const performanceMetrics =
      params.includePerformanceMetrics !== false
        ? this.calculatePerformanceMetrics(returns, prices.adjustedClose)
        : {
            totalReturn: 0,
            annualizedReturn: 0,
            volatility: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            calmarRatio: 0,
          };

    return {
      symbol,
      dates,
      prices,
      returns,
      technicalIndicators,
      performanceMetrics,
    };
  }

  /**
   * Calcola i rendimenti giornalieri e cumulativi
   */
  private calculateReturns(prices: number[]): {
    daily: number[];
    cumulative: number[];
    logReturns: number[];
  } {
    const daily: number[] = [];
    const logReturns: number[] = [];
    const cumulative: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      const logReturn = Math.log(prices[i] / prices[i - 1]);

      daily.push(dailyReturn);
      logReturns.push(logReturn);

      const cumulativeReturn =
        i === 1 ? dailyReturn : (1 + cumulative[i - 2]) * (1 + dailyReturn) - 1;
      cumulative.push(cumulativeReturn);
    }

    return { daily, cumulative, logReturns };
  }

  /**
   * Calcola indicatori tecnici avanzati
   */
  private calculateTechnicalIndicators(prices: number[], volume: number[]) {
    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200),
      rsi: this.calculateRSI(prices, 14),
      bollingerBands: this.calculateBollingerBands(prices, 20, 2),
      macd: this.calculateMACD(prices, 12, 26, 9),
    };
  }

  /**
   * Calcola Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }

    return sma;
  }

  /**
   * Calcola Relative Strength Index
   */
  private calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calcola gains e losses
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    // Calcola RSI
    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(NaN);
      } else {
        const avgGain =
          gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) /
          period;
        const avgLoss =
          losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) /
          period;

        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - 100 / (1 + rs));
        }
      }
    }

    return rsi;
  }

  /**
   * Calcola Bollinger Bands
   */
  private calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ) {
    const upper: number[] = [];
    const middle: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        middle.push(NaN);
        lower.push(NaN);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance =
          slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);

        middle.push(mean);
        upper.push(mean + stdDev * standardDeviation);
        lower.push(mean - stdDev * standardDeviation);
      }
    }

    return { upper, middle, lower };
  }

  /**
   * Calcola MACD
   */
  private calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);

    const macd: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (isNaN(ema12[i]) || isNaN(ema26[i])) {
        macd.push(NaN);
      } else {
        macd.push(ema12[i] - ema26[i]);
      }
    }

    const signal = this.calculateEMA(
      macd.filter(x => !isNaN(x)),
      signalPeriod
    );
    const histogram: number[] = [];

    for (let i = 0; i < macd.length; i++) {
      if (isNaN(macd[i]) || isNaN(signal[i])) {
        histogram.push(NaN);
      } else {
        histogram.push(macd[i] - signal[i]);
      }
    }

    return { macd, signal, histogram };
  }

  /**
   * Calcola Exponential Moving Average
   */
  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        ema.push(prices[i]);
      } else {
        ema.push(prices[i] * multiplier + ema[i - 1] * (1 - multiplier));
      }
    }

    return ema;
  }

  /**
   * Calcola metriche di performance
   */
  private calculatePerformanceMetrics(
    returns: { daily: number[]; cumulative: number[] },
    prices: number[]
  ) {
    const totalReturn = returns.cumulative[returns.cumulative.length - 1] || 0;

    // Calcola rendimento annualizzato
    const days = returns.daily.length;
    const years = days / 252; // Assumiamo 252 giorni di trading
    const annualizedReturn =
      years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

    // Calcola volatilità annualizzata
    const meanReturn =
      returns.daily.reduce((a, b) => a + b, 0) / returns.daily.length;
    const variance =
      returns.daily.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) /
      returns.daily.length;
    const volatility = Math.sqrt(variance * 252); // Annualizzata

    // Calcola Sharpe Ratio (assumendo risk-free rate = 0.02)
    const riskFreeRate = 0.02;
    const sharpeRatio =
      volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    // Calcola Maximum Drawdown
    const maxDrawdown = this.calculateMaxDrawdown(prices);

    // Calcola Calmar Ratio
    const calmarRatio =
      maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      calmarRatio,
    };
  }

  /**
   * Calcola Maximum Drawdown
   */
  private calculateMaxDrawdown(prices: number[]): number {
    let maxDrawdown = 0;
    let peak = prices[0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      } else {
        const drawdown = (peak - prices[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    return maxDrawdown;
  }

  /**
   * Calcola dati del portafoglio (equal-weighted)
   */
  private calculatePortfolioData(processedData: ProcessedHistoricalData[]) {
    // Trova le date comuni
    const commonDates = this.findCommonDates(processedData.map(d => d.dates));

    if (commonDates.length === 0) {
      return undefined;
    }

    const portfolioValue: number[] = [];
    const portfolioReturns: number[] = [];

    // Calcola valore del portafoglio per ogni data
    for (let i = 0; i < commonDates.length; i++) {
      const date = commonDates[i];
      let totalValue = 0;

      for (const data of processedData) {
        const dateIndex = data.dates.indexOf(date);
        if (dateIndex !== -1) {
          totalValue += data.prices.adjustedClose[dateIndex];
        }
      }

      portfolioValue.push(totalValue);

      // Calcola rendimento del portafoglio
      if (i > 0) {
        const return_ =
          (totalValue - portfolioValue[i - 1]) / portfolioValue[i - 1];
        portfolioReturns.push(return_);
      }
    }

    // Calcola metriche del portafoglio
    const totalReturn =
      portfolioValue.length > 1
        ? (portfolioValue[portfolioValue.length - 1] - portfolioValue[0]) /
          portfolioValue[0]
        : 0;

    const years = portfolioReturns.length / 252;
    const annualizedReturn =
      years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

    const meanReturn =
      portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const variance =
      portfolioReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) /
      portfolioReturns.length;
    const volatility = Math.sqrt(variance * 252);

    const riskFreeRate = 0.02;
    const sharpeRatio =
      volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    const maxDrawdown = this.calculateMaxDrawdown(portfolioValue);

    return {
      dates: commonDates,
      portfolioValue,
      portfolioReturns,
      portfolioMetrics: {
        totalReturn,
        annualizedReturn,
        volatility,
        sharpeRatio,
        maxDrawdown,
      },
    };
  }

  /**
   * Trova le date comuni tra tutti i dataset
   */
  private findCommonDates(allDates: string[][]): string[] {
    if (allDates.length === 0) return [];

    const commonDates = allDates[0].filter(date =>
      allDates.every(dates => dates.includes(date))
    );

    return commonDates.sort();
  }

  /**
   * Identifica fasi di mercato (bull/bear/consolidation)
   */
  private identifyMarketPhases(data: ProcessedHistoricalData) {
    const { prices, returns } = data;
    const bullMarkets: Array<{
      start: string;
      end: string;
      duration: number;
      return: number;
    }> = [];
    const bearMarkets: Array<{
      start: string;
      end: string;
      duration: number;
      return: number;
    }> = [];
    const consolidation: Array<{
      start: string;
      end: string;
      duration: number;
    }> = [];

    let currentPhase: 'bull' | 'bear' | 'consolidation' | null = null;
    let phaseStart = 0;
    let phaseStartPrice = prices.adjustedClose[0];

    for (let i = 1; i < prices.adjustedClose.length; i++) {
      const currentPrice = prices.adjustedClose[i];
      const priceChange = (currentPrice - phaseStartPrice) / phaseStartPrice;
      const daysSinceStart = i - phaseStart;

      // Definisci le soglie per le fasi di mercato
      const bullThreshold = 0.2; // 20% di rialzo
      const bearThreshold = -0.15; // 15% di ribasso
      const consolidationThreshold = 0.05; // 5% di movimento

      let newPhase: 'bull' | 'bear' | 'consolidation' | null = null;

      if (priceChange >= bullThreshold) {
        newPhase = 'bull';
      } else if (priceChange <= bearThreshold) {
        newPhase = 'bear';
      } else if (
        Math.abs(priceChange) <= consolidationThreshold &&
        daysSinceStart >= 30
      ) {
        newPhase = 'consolidation';
      }

      // Se la fase è cambiata, registra la fase precedente
      if (newPhase !== currentPhase && currentPhase !== null) {
        const phaseData = {
          start: data.dates[phaseStart],
          end: data.dates[i - 1],
          duration: daysSinceStart,
          return: priceChange,
        };

        switch (currentPhase) {
          case 'bull':
            bullMarkets.push(phaseData);
            break;
          case 'bear':
            bearMarkets.push(phaseData);
            break;
          case 'consolidation':
            consolidation.push(phaseData);
            break;
        }

        // Inizia nuova fase
        phaseStart = i - 1;
        phaseStartPrice = currentPrice;
      }

      currentPhase = newPhase;
    }

    return { bullMarkets, bearMarkets, consolidation };
  }
}

// Esporta un'istanza singleton
export const historicalAnalysisService = new HistoricalAnalysisService();
