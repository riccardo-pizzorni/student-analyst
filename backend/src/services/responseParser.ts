/**
 * Response Parser per STUDENT ANALYST
 * 
 * Sistema di parsing universale per diverse fonti di dati finanziari
 * Converte formati proprietari in struttura dati intermedia standardizzata
 */

import { SupportedDataSource } from './dataTransformer';

// ========== INTERFACCE ==========

export interface ParsedFinancialData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
  rawData: unknown; // Dati originali per debug/audit
}

export interface ParsedMetadata {
  symbol: string;
  source: SupportedDataSource;
  timeframe: string;
  lastRefreshed: string;
  timezone: string;
  outputSize?: string;
  interval?: string;
  rawMetadata: unknown;
}

export interface ParsingResult {
  success: boolean;
  data: ParsedFinancialData[];
  metadata?: ParsedMetadata;
  errors: ParsingError[];
  warnings: string[];
  stats: {
    recordsParsed: number;
    recordsSkipped: number;
    parsingTimeMs: number;
  };
}

export interface ParsingError {
  type: 'STRUCTURE_ERROR' | 'FIELD_ERROR' | 'VALUE_ERROR' | 'FORMAT_ERROR';
  message: string;
  field?: string;
  record?: number;
  originalValue: unknown;
}

// ========== CLASSE PRINCIPALE ==========

export class ResponseParser {
  /**
   * Parsing principale che delega al parser specifico per fonte
   */
  public parse(rawData: unknown, source: SupportedDataSource): ParsedFinancialData[] {
    const startTime = Date.now();
    
    try {
      let result: ParsingResult;
      
      switch (source) {
        case SupportedDataSource.ALPHA_VANTAGE:
          result = this.parseAlphaVantage(rawData as Record<string, unknown>);
          break;
          
        case SupportedDataSource.YAHOO_FINANCE:
          result = this.parseYahooFinance(rawData as Record<string, unknown>);
          break;
          
        case SupportedDataSource.IEX_CLOUD:
          result = this.parseIEXCloud(rawData as Record<string, unknown>);
          break;
          
        case SupportedDataSource.POLYGON:
          result = this.parsePolygon(rawData as Record<string, unknown>);
          break;
          
        case SupportedDataSource.QUANDL:
          result = this.parseQuandl(rawData as Record<string, unknown>);
          break;
          
        default:
          throw new Error(`Fonte dati non supportata: ${source}`);
      }
      
      result.stats.parsingTimeMs = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error(`Errore parsing ${source}: ${result.errors.map(e => e.message).join(', ')}`);
      }
      
      return result.data;
      
    } catch (error) {
      throw new Error(`Errore critico durante parsing ${source}: ${(error as Error).message}`);
    }
  }

  /**
   * Parser per Alpha Vantage API responses
   */
  private parseAlphaVantage(rawData: Record<string, unknown>): ParsingResult {
    const errors: ParsingError[] = [];
    const warnings: string[] = [];
    const result: ParsedFinancialData[] = [];

    try {
      // Validazione struttura base
      if (!rawData || typeof rawData !== 'object') {
        return this.createErrorResult('STRUCTURE_ERROR', 'Risposta Alpha Vantage non valida');
      }

      // Trova chiavi di dati e metadati
      const keys = Object.keys(rawData);
      const metadataKey = keys.find(key => key.toLowerCase().includes('meta data'));
      const dataKey = keys.find(key => 
        key.includes('Time Series') || 
        key.includes('Weekly') || 
        key.includes('Monthly')
      );

      if (!dataKey) {
        return this.createErrorResult('STRUCTURE_ERROR', 'Chiave dati time series non trovata');
      }

      const timeSeriesData = rawData[dataKey];
      if (!timeSeriesData || typeof timeSeriesData !== 'object') {
        return this.createErrorResult('STRUCTURE_ERROR', 'Dati time series non validi');
      }

      // Parsing dei dati OHLCV
      let recordIndex = 0;
      for (const [timestamp, values] of Object.entries(timeSeriesData)) {
        try {
          if (!values || typeof values !== 'object') {
            errors.push({
              type: 'VALUE_ERROR',
              message: 'Valori OHLCV non validi',
              record: recordIndex,
              originalValue: values
            });
            continue;
          }

          const valuesObj = values as Record<string, unknown>;
          
          // Mapping campi Alpha Vantage (supporta sia adjusted che non-adjusted)
          const open = this.parseNumber(valuesObj['1. open'], 'open', recordIndex, errors);
          const high = this.parseNumber(valuesObj['2. high'], 'high', recordIndex, errors);
          const low = this.parseNumber(valuesObj['3. low'], 'low', recordIndex, errors);
          const close = this.parseNumber(valuesObj['4. close'], 'close', recordIndex, errors);
          const volume = this.parseNumber(valuesObj['5. volume'] || valuesObj['6. volume'], 'volume', recordIndex, errors);
          
          // Adjusted close se disponibile
          const adjustedClose = valuesObj['5. adjusted close'] 
            ? this.parseNumber(valuesObj['5. adjusted close'], 'adjustedClose', recordIndex, errors) ?? undefined
            : undefined;

          // Validazione OHLC logic
          if (open !== null && high !== null && low !== null && close !== null) {
            if (high < Math.max(open, close) || low > Math.min(open, close)) {
              warnings.push(`Record ${recordIndex}: Possibile anomalia OHLC (H:${high}, L:${low}, O:${open}, C:${close})`);
            }
          }

          if (open !== null && high !== null && low !== null && close !== null && volume !== null) {
            result.push({
              date: timestamp,
              open,
              high,
              low,
              close,
              adjustedClose,
              volume,
              rawData: valuesObj
            });
          }

          recordIndex++;
        } catch (error) {
          errors.push({
            type: 'VALUE_ERROR',
            message: `Errore parsing record: ${(error as Error).message}`,
            record: recordIndex,
            originalValue: values
          });
        }
      }

      return {
        success: result.length > 0,
        data: result,
        errors,
        warnings,
        stats: {
          recordsParsed: result.length,
          recordsSkipped: recordIndex - result.length,
          parsingTimeMs: 0
        }
      };

    } catch (error) {
      return this.createErrorResult('STRUCTURE_ERROR', `Errore generale Alpha Vantage: ${(error as Error).message}`);
    }
  }

  /**
   * Parser per Yahoo Finance API responses
   */
  private parseYahooFinance(rawData: Record<string, unknown>): ParsingResult {
    const errors: ParsingError[] = [];
    const warnings: string[] = [];
    const result: ParsedFinancialData[] = [];

    try {
      // Yahoo Finance può avere diverse strutture
      let dataArray: Record<string, unknown>[] = [];

      // Formato 1: { chart: { result: [{ indicators: { quote: [{}] }, timestamp: [] }] } }
      if (rawData.chart && typeof rawData.chart === 'object' && rawData.chart.result && Array.isArray(rawData.chart.result) && rawData.chart.result[0]) {
        const chartData = rawData.chart.result[0];
        const timestamps = chartData.timestamp || [];
        const quote = chartData.indicators?.quote?.[0] || {};
        const adjclose = chartData.indicators?.adjclose?.[0]?.adjclose || [];

        for (let i = 0; i < timestamps.length; i++) {
          if (quote.open?.[i] !== null && quote.open?.[i] !== undefined) {
            const timestamp = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            
            result.push({
              date: timestamp,
              open: quote.open[i],
              high: quote.high[i],
              low: quote.low[i],
              close: quote.close[i],
              adjustedClose: adjclose[i] || quote.close[i],
              volume: quote.volume[i] || 0,
              rawData: { 
                timestamp: timestamps[i], 
                quote: {
                  open: quote.open[i],
                  high: quote.high[i],
                  low: quote.low[i],
                  close: quote.close[i],
                  volume: quote.volume[i]
                }
              }
            });
          }
        }
      }
      // Formato 2: Array diretto con oggetti OHLCV
      else if (Array.isArray(rawData)) {
        dataArray = rawData as Record<string, unknown>[];
      }
      // Formato 3: Oggetto con array di dati
      else if (rawData.data && Array.isArray(rawData.data)) {
        dataArray = rawData.data as Record<string, unknown>[];
      }
      // Formato 4: Response wrapper
      else if (rawData.response && typeof rawData.response === 'object' && rawData.response.data) {
        dataArray = Array.isArray(rawData.response.data) ? rawData.response.data : [rawData.response.data] as Record<string, unknown>[];
      }

      // Processa array diretto se disponibile
      if (dataArray.length > 0) {
        for (let i = 0; i < dataArray.length; i++) {
          const item = dataArray[i];
          
          try {
            const parsed = this.parseYahooFinanceRecord(item, i);
            if (parsed) {
              result.push(parsed);
            }
          } catch (error) {
            errors.push({
              type: 'VALUE_ERROR',
              message: `Errore parsing record Yahoo Finance: ${(error as Error).message}`,
              record: i,
              originalValue: item
            });
          }
        }
      }

      return {
        success: result.length > 0,
        data: result,
        errors,
        warnings,
        stats: {
          recordsParsed: result.length,
          recordsSkipped: dataArray.length - result.length,
          parsingTimeMs: 0
        }
      };

    } catch (error) {
      return this.createErrorResult('STRUCTURE_ERROR', `Errore generale Yahoo Finance: ${(error as Error).message}`);
    }
  }

  /**
   * Parser per singolo record Yahoo Finance
   */
  private parseYahooFinanceRecord(item: Record<string, unknown>, index: number): ParsedFinancialData | null {
    if (!item || typeof item !== 'object') return null;

    // Possibili mapping dei campi
    const dateField = item.date || item.Date || item.timestamp || item.time;
    const openField = item.open || item.Open || item.o;
    const highField = item.high || item.High || item.h;
    const lowField = item.low || item.Low || item.l;
    const closeField = item.close || item.Close || item.c;
    const adjCloseField = item.adjClose || item['Adj Close'] || item.adjustedClose;
    const volumeField = item.volume || item.Volume || item.v;

    if (!dateField || openField === undefined || highField === undefined || 
        lowField === undefined || closeField === undefined) {
      return null;
    }

    return {
      date: String(dateField),
      open: Number(openField),
      high: Number(highField),
      low: Number(lowField),
      close: Number(closeField),
      adjustedClose: adjCloseField ? Number(adjCloseField) : undefined,
      volume: volumeField ? Number(volumeField) : 0,
      rawData: item
    };
  }

  /**
   * Parser per IEX Cloud (implementazione base)
   */
  private parseIEXCloud(rawData: Record<string, unknown>): ParsingResult {
    const result: ParsedFinancialData[] = [];
    const errors: ParsingError[] = [];

    try {
      const dataArray = Array.isArray(rawData) ? rawData : [rawData];
      
      for (let i = 0; i < dataArray.length; i++) {
        const item = dataArray[i];
        
        if (item && typeof item === 'object') {
          result.push({
            date: item.date || item.priceDate,
            open: Number(item.open || item.fOpen),
            high: Number(item.high || item.fHigh),
            low: Number(item.low || item.fLow),
            close: Number(item.close || item.fClose),
            adjustedClose: item.adjustedClose ? Number(item.adjustedClose) : undefined,
            volume: Number(item.volume || item.fVolume || 0),
            rawData: item
          });
        }
      }

      return {
        success: result.length > 0,
        data: result,
        errors,
        warnings: [],
        stats: {
          recordsParsed: result.length,
          recordsSkipped: dataArray.length - result.length,
          parsingTimeMs: 0
        }
      };

    } catch (error) {
      return this.createErrorResult('STRUCTURE_ERROR', `Errore IEX Cloud: ${(error as Error).message}`);
    }
  }

  /**
   * Parser per Polygon (implementazione base)
   */
  private parsePolygon(rawData: Record<string, unknown>): ParsingResult {
    const result: ParsedFinancialData[] = [];
    const errors: ParsingError[] = [];

    try {
      const results = (rawData.results && Array.isArray(rawData.results)) ? rawData.results : (rawData.values && Array.isArray(rawData.values)) ? rawData.values : [];
      
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        
        if (item && typeof item === 'object') {
          // Polygon usa timestamp Unix in milliseconds
          const date = item.t ? new Date(item.t).toISOString().split('T')[0] : item.date;
          
          result.push({
            date: date,
            open: Number(item.o || item.open),
            high: Number(item.h || item.high),
            low: Number(item.l || item.low),
            close: Number(item.c || item.close),
            volume: Number(item.v || item.volume || 0),
            rawData: item
          });
        }
      }

      return {
        success: result.length > 0,
        data: result,
        errors,
        warnings: [],
        stats: {
          recordsParsed: result.length,
          recordsSkipped: results.length - result.length,
          parsingTimeMs: 0
        }
      };

    } catch (error) {
      return this.createErrorResult('STRUCTURE_ERROR', `Errore Polygon: ${(error as Error).message}`);
    }
  }

  /**
   * Parser per Quandl (implementazione base)
   */
  private parseQuandl(rawData: Record<string, unknown>): ParsingResult {
    const result: ParsedFinancialData[] = [];
    const errors: ParsingError[] = [];

    try {
      const data = rawData.dataset?.data || rawData.data || [];
      const columns = rawData.dataset?.column_names || ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        if (Array.isArray(row) && row.length >= 5) {
          result.push({
            date: String(row[0]),
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
            volume: row[5] ? Number(row[5]) : 0,
            rawData: { columns, values: row }
          });
        }
      }

      return {
        success: result.length > 0,
        data: result,
        errors,
        warnings: [],
        stats: {
          recordsParsed: result.length,
          recordsSkipped: data.length - result.length,
          parsingTimeMs: 0
        }
      };

    } catch (error) {
      return this.createErrorResult('STRUCTURE_ERROR', `Errore Quandl: ${(error as Error).message}`);
    }
  }

  /**
   * Parsing sicuro di valori numerici
   */
  private parseNumber(value: unknown, field: string, record: number, errors: ParsingError[]): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = Number(value);
    
    if (isNaN(num)) {
      errors.push({
        type: 'VALUE_ERROR',
        message: `Valore non numerico per campo ${field}`,
        field,
        record,
        originalValue: value
      });
      return null;
    }

    // Validazione range ragionevoli
    if (field === 'volume' && num < 0) {
      errors.push({
        type: 'VALUE_ERROR',
        message: `Volume negativo`,
        field,
        record,
        originalValue: value
      });
      return null;
    }

    if (['open', 'high', 'low', 'close'].includes(field) && (num <= 0 || num > 1000000)) {
      errors.push({
        type: 'VALUE_ERROR',
        message: `Prezzo fuori range ragionevole (${num})`,
        field,
        record,
        originalValue: value
      });
      return null;
    }

    return num;
  }

  /**
   * Crea risultato di errore standardizzato
   */
  private createErrorResult(type: ParsingError['type'], message: string): ParsingResult {
    return {
      success: false,
      data: [],
      errors: [{ type, message }],
      warnings: [],
      stats: {
        recordsParsed: 0,
        recordsSkipped: 0,
        parsingTimeMs: 0
      }
    };
  }

  /**
   * Test parsing per debugging
   */
  public testParsing(rawData: unknown, source: SupportedDataSource): {
    canParse: boolean;
    preview: ParsedFinancialData[];
    structure: unknown;
    errors: string[];
  } {
    try {
      const parsed = this.parse(rawData, source);
      
      return {
        canParse: true,
        preview: parsed.slice(0, 3), // Prime 3 righe
        structure: this.analyzeStructure(rawData),
        errors: []
      };
    } catch (error) {
      return {
        canParse: false,
        preview: [],
        structure: this.analyzeStructure(rawData),
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Analizza struttura dati per debugging
   */
  private analyzeStructure(data: unknown): unknown {
    if (data === null || data === undefined) return { type: 'null' };
    if (Array.isArray(data)) return { type: 'array', length: data.length, sample: data[0] };
    if (typeof data === 'object') return { type: 'object', keys: Object.keys(data).slice(0, 10) };
    return { type: typeof data, value: data };
  }
} 