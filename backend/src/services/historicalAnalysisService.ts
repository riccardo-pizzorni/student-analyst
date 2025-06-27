import {
  DataSource,
  DataSourceManager,
  UnifiedDataResponse,
} from './dataSourceManager';

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
    dataSources: {
      primary: DataSource;
      fallbacks: DataSource[];
    };
  };
  error?: string;
}

/**
 * Classe per l'analisi storica avanzata
 * Aggiornata per usare DataSourceManager invece di AlphaVantageService
 */
export class HistoricalAnalysisService {
  private dataSourceManager: DataSourceManager;

  constructor() {
    this.dataSourceManager = new DataSourceManager({
      primarySource: DataSource.YAHOO_FINANCE,
      enableFallback: true,
      logFallbacks: true,
    });
  }

  /**
   * Funzione principale per eseguire l'analisi storica
   */
  public async performHistoricalAnalysis(
    params: HistoricalAnalysisParams
  ): Promise<HistoricalAnalysisResponse> {
    const startTime = Date.now();
    const fallbackSources: DataSource[] = [];

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

      // 2. Filtra i risultati riusciti e raccogli informazioni sui fallback
      const successfulData = historicalDataResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            const data = result.value;
            if (data.fallbackUsed) {
              fallbackSources.push(data.source);
            }
            return { ticker: params.tickers[index], data: data.data };
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
        data: Array<{
          date: string;
          open: number;
          high: number;
          low: number;
          close: number;
          adjustedClose?: number;
          volume: number;
          timestamp?: string;
        }>;
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
          dataSources: {
            primary: DataSource.YAHOO_FINANCE,
            fallbacks: [...new Set(fallbackSources)],
          },
        },
      };
    } catch (error) {
      console.error("❌ Errore durante l'analisi storica:", error);
      return {
        success: false,
        data: {
          historicalData: [],
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          symbols: params.tickers,
          period: { start: params.startDate, end: params.endDate },
          frequency: params.frequency,
          dataPoints: 0,
          processingTime: Date.now() - startTime,
          dataSources: {
            primary: DataSource.YAHOO_FINANCE,
            fallbacks: fallbackSources,
          },
        },
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
      };
    }
  }

  /**
   * Fetch dati storici usando DataSourceManager
   */
  private async fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string,
    frequency: string
  ): Promise<UnifiedDataResponse> {
    try {
      const response = await this.dataSourceManager.getStockData(
        symbol,
        frequency,
        {
          startDate,
          endDate,
          useCache: true,
        }
      );

      // Filtra i dati per il periodo richiesto
      const filteredData = response.data.filter(item => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });

      return {
        ...response,
        data: filteredData,
      };
    } catch (error) {
      console.error(`❌ Errore nel fetch dati per ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Processa i dati storici per un singolo ticker
   */
  private async processHistoricalData(
    symbol: string,
    data: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      adjustedClose?: number;
      volume: number;
      timestamp?: string;
    }>,
    params: HistoricalAnalysisParams
  ): Promise<ProcessedHistoricalData> {
    // Ordina i dati per data
    const sortedData = data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Estrai array di prezzi e volumi
    const dates = sortedData.map(item => item.date);
    const prices = {
      open: sortedData.map(item => item.open),
      high: sortedData.map(item => item.high),
      low: sortedData.map(item => item.low),
      close: sortedData.map(item => item.close),
      adjustedClose: sortedData.map(item => item.adjustedClose || item.close),
      volume: sortedData.map(item => item.volume),
    };

    // Calcola i rendimenti
    const returns = this.calculateReturns(prices.adjustedClose);

    // Calcola indicatori tecnici se richiesti
    let technicalIndicators = {
      sma20: [] as number[],
      sma50: [] as number[],
      sma200: [] as number[],
      rsi: [] as number[],
      bollingerBands: {
        upper: [] as number[],
        middle: [] as number[],
        lower: [] as number[],
      },
      macd: {
        macd: [] as number[],
        signal: [] as number[],
        histogram: [] as number[],
      },
    };

    if (params.includeTechnicalIndicators) {
      technicalIndicators = this.calculateTechnicalIndicators(
        prices.adjustedClose,
        prices.volume
      );
    }

    // Calcola metriche di performance se richieste
    let performanceMetrics = {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
    };

    if (params.includePerformanceMetrics) {
      performanceMetrics = this.calculatePerformanceMetrics(
        returns,
        prices.adjustedClose
      );
    }

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
   * Calcola i rendimenti dai prezzi
   */
  private calculateReturns(prices: number[]): {
    daily: number[];
    cumulative: number[];
    logReturns: number[];
  } {
    if (prices.length < 2) {
      return {
        daily: [],
        cumulative: [],
        logReturns: [],
      };
    }

    const daily: number[] = [];
    const logReturns: number[] = [];
    const cumulative: number[] = [];

    // Calcola rendimenti giornalieri
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      daily.push(dailyReturn);
      logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }

    // Calcola rendimenti cumulativi
    let cumulativeReturn = 1;
    for (const dailyReturn of daily) {
      cumulativeReturn *= 1 + dailyReturn;
      cumulative.push(cumulativeReturn - 1);
    }

    return { daily, cumulative, logReturns };
  }

  /**
   * Calcola indicatori tecnici
   */
  private calculateTechnicalIndicators(prices: number[], volume: number[]) {
    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200),
      rsi: this.calculateRSI(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      macd: this.calculateMACD(prices),
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
   * Calcola RSI
   */
  private calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(NaN);
      } else {
        const gains: number[] = [];
        const losses: number[] = [];

        for (let j = i - period + 1; j <= i; j++) {
          const change = prices[j] - prices[j - 1];
          gains.push(change > 0 ? change : 0);
          losses.push(change < 0 ? -change : 0);
        }

        const avgGain = gains.reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

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
        const sma = slice.reduce((a, b) => a + b, 0) / period;
        const variance =
          slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) /
          period;
        const standardDeviation = Math.sqrt(variance);

        middle.push(sma);
        upper.push(sma + standardDeviation * stdDev);
        lower.push(sma - standardDeviation * stdDev);
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

    const signal = this.calculateEMA(macd, signalPeriod);
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
      } else if (i < period - 1) {
        ema.push(NaN);
      } else {
        const newEMA = prices[i] * multiplier + ema[i - 1] * (1 - multiplier);
        ema.push(newEMA);
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
    if (returns.daily.length === 0) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        calmarRatio: 0,
      };
    }

    const totalReturn = returns.cumulative[returns.cumulative.length - 1];
    const annualizedReturn =
      Math.pow(1 + totalReturn, 252 / returns.daily.length) - 1;

    const meanReturn =
      returns.daily.reduce((a, b) => a + b, 0) / returns.daily.length;
    const variance =
      returns.daily.reduce(
        (sum, ret) => sum + Math.pow(ret - meanReturn, 2),
        0
      ) / returns.daily.length;
    const volatility = Math.sqrt(variance * 252);

    const riskFreeRate = 0.02; // 2% annual risk-free rate
    const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;

    const maxDrawdown = this.calculateMaxDrawdown(prices);
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

    for (const price of prices) {
      if (price > peak) {
        peak = price;
      }
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calcola dati del portafoglio
   */
  private calculatePortfolioData(processedData: ProcessedHistoricalData[]) {
    // Trova date comuni
    const allDates = processedData.map(data => data.dates);
    const commonDates = this.findCommonDates(allDates);

    if (commonDates.length === 0) {
      return undefined;
    }

    // Calcola valore portafoglio per ogni data
    const portfolioValue: number[] = [];
    const portfolioReturns: number[] = [];

    // Assumi pesi uguali per semplicità
    const weights = processedData.map(() => 1 / processedData.length);

    for (let i = 0; i < commonDates.length; i++) {
      const date = commonDates[i];
      let totalValue = 0;

      for (let j = 0; j < processedData.length; j++) {
        const dataIndex = processedData[j].dates.indexOf(date);
        if (dataIndex !== -1) {
          totalValue +=
            processedData[j].prices.adjustedClose[dataIndex] * weights[j];
        }
      }

      portfolioValue.push(totalValue);

      if (i > 0) {
        const return_ =
          (totalValue - portfolioValue[i - 1]) / portfolioValue[i - 1];
        portfolioReturns.push(return_);
      }
    }

    // Calcola metriche del portafoglio
    const totalReturn =
      (portfolioValue[portfolioValue.length - 1] - portfolioValue[0]) /
      portfolioValue[0];
    const annualizedReturn =
      Math.pow(1 + totalReturn, 252 / portfolioReturns.length) - 1;

    const meanReturn =
      portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const variance =
      portfolioReturns.reduce(
        (sum, ret) => sum + Math.pow(ret - meanReturn, 2),
        0
      ) / portfolioReturns.length;
    const volatility = Math.sqrt(variance * 252);

    const riskFreeRate = 0.02;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;

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
   * Trova date comuni tra tutti i dataset
   */
  private findCommonDates(allDates: string[][]): string[] {
    if (allDates.length === 0) return [];

    const commonDates = allDates[0].filter(date =>
      allDates.every(dates => dates.includes(date))
    );

    return commonDates.sort();
  }

  /**
   * Identifica fasi di mercato
   */
  private identifyMarketPhases(data: ProcessedHistoricalData) {
    const prices = data.prices.adjustedClose;
    const dates = data.dates;

    if (prices.length < 20) {
      return {
        bullMarkets: [],
        bearMarkets: [],
        consolidation: [],
      };
    }

    const sma20 = this.calculateSMA(prices, 20);
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
    let phaseStartPrice = prices[0];

    for (let i = 20; i < prices.length; i++) {
      const price = prices[i];
      const sma = sma20[i];

      let newPhase: 'bull' | 'bear' | 'consolidation' | null = null;

      if (price > sma * 1.05) {
        newPhase = 'bull';
      } else if (price < sma * 0.95) {
        newPhase = 'bear';
      } else {
        newPhase = 'consolidation';
      }

      if (newPhase !== currentPhase) {
        // Chiudi fase precedente
        if (currentPhase && i - phaseStart > 5) {
          const phaseReturn = (price - phaseStartPrice) / phaseStartPrice;
          const phaseData = {
            start: dates[phaseStart],
            end: dates[i - 1],
            duration: i - phaseStart,
            return: phaseReturn,
          };

          switch (currentPhase) {
            case 'bull':
              bullMarkets.push(phaseData);
              break;
            case 'bear':
              bearMarkets.push(phaseData);
              break;
            case 'consolidation':
              consolidation.push({
                start: dates[phaseStart],
                end: dates[i - 1],
                duration: i - phaseStart,
              });
              break;
          }
        }

        // Inizia nuova fase
        currentPhase = newPhase;
        phaseStart = i;
        phaseStartPrice = price;
      }
    }

    return { bullMarkets, bearMarkets, consolidation };
  }

  /**
   * Health check del servizio
   */
  public async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    dataSourceManager: any;
  }> {
    try {
      const dataSourceHealth = await this.dataSourceManager.healthCheck();

      return {
        status: dataSourceHealth.status,
        timestamp: new Date().toISOString(),
        dataSourceManager: dataSourceHealth,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        dataSourceManager: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Esporta un'istanza singleton
export const historicalAnalysisService = new HistoricalAnalysisService();
