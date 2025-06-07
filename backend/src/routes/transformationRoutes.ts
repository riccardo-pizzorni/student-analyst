/**
 * Transformation Routes per STUDENT ANALYST
 * 
 * API endpoints per il sistema di trasformazione dati finanziari
 * Espone funzionalità di parsing, normalizzazione e validazione
 */

import { Router, Request, Response } from 'express';
import { DataTransformer, SupportedDataSource, StandardFinancialResponse } from '../services/dataTransformer';
import { DateNormalizer } from '../services/dateNormalizer';
import { PriceAdjuster } from '../services/priceAdjuster';
import { VolumeHandler } from '../services/volumeHandler';
import { ResponseParser } from '../services/responseParser';

const router = Router();

// Istanze dei servizi
const dataTransformer = new DataTransformer();
const dateNormalizer = new DateNormalizer();
const priceAdjuster = new PriceAdjuster();
const volumeHandler = new VolumeHandler();
const responseParser = new ResponseParser();

/**
 * POST /api/v1/transform
 * Trasforma dati finanziari da qualsiasi formato in formato standard
 */
router.post('/transform', async (req: Request, res: Response) => {
  try {
    const { rawData, source, symbol, timeframe, config } = req.body;

    // Validazione input
    if (!rawData) {
      return res.status(400).json({
        success: false,
        error: 'Campo rawData richiesto',
        code: 'MISSING_RAW_DATA'
      });
    }

    if (!source || !Object.values(SupportedDataSource).includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Fonte dati non supportata',
        supportedSources: Object.values(SupportedDataSource),
        code: 'INVALID_SOURCE'
      });
    }

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Simbolo richiesto',
        code: 'MISSING_SYMBOL'
      });
    }

    // Aggiorna configurazione se fornita
    if (config) {
      dataTransformer.updateConfig(config);
    }

    // Trasformazione
    const result: StandardFinancialResponse = await dataTransformer.transform(
      rawData,
      source as SupportedDataSource,
      symbol,
      timeframe || 'daily'
    );

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante trasformazione',
      details: (error as Error).message,
      code: 'TRANSFORMATION_ERROR'
    });
  }
});

/**
 * POST /api/v1/transform/parse
 * Solo parsing senza trasformazione completa
 */
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { rawData, source } = req.body;

    if (!rawData || !source) {
      return res.status(400).json({
        success: false,
        error: 'rawData e source richiesti',
        code: 'MISSING_PARAMETERS'
      });
    }

    const parsedData = responseParser.parse(rawData, source as SupportedDataSource);

    res.json({
      success: true,
      data: parsedData,
      count: parsedData.length,
      source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante parsing',
      details: (error as Error).message,
      code: 'PARSING_ERROR'
    });
  }
});

/**
 * POST /api/v1/transform/normalize-dates
 * Solo normalizzazione date
 */
router.post('/normalize-dates', async (req: Request, res: Response) => {
  try {
    const { data, timezone, validationRules } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Array di dati richiesto',
        code: 'INVALID_DATA'
      });
    }

    const normalizer = new DateNormalizer(timezone, validationRules);
    const normalizedData = normalizer.normalize(data);

    res.json({
      success: true,
      data: normalizedData,
      originalCount: data.length,
      normalizedCount: normalizedData.length,
      skipped: data.length - normalizedData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante normalizzazione date',
      details: (error as Error).message,
      code: 'DATE_NORMALIZATION_ERROR'
    });
  }
});

/**
 * POST /api/v1/transform/adjust-prices
 * Solo aggiustamento prezzi per splits
 */
router.post('/adjust-prices', async (req: Request, res: Response) => {
  try {
    const { data, symbol, config } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Array di dati richiesto',
        code: 'INVALID_DATA'
      });
    }

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Simbolo richiesto',
        code: 'MISSING_SYMBOL'
      });
    }

    const adjuster = new PriceAdjuster(config);
    const adjustedData = await adjuster.adjustForSplits(data, symbol);

    res.json({
      success: true,
      data: adjustedData,
      originalCount: data.length,
      adjustedCount: adjustedData.length,
      symbol,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante aggiustamento prezzi',
      details: (error as Error).message,
      code: 'PRICE_ADJUSTMENT_ERROR'
    });
  }
});

/**
 * POST /api/v1/transform/normalize-volume
 * Solo normalizzazione volume
 */
router.post('/normalize-volume', async (req: Request, res: Response) => {
  try {
    const { data, config } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Array di dati richiesto',
        code: 'INVALID_DATA'
      });
    }

    const handler = new VolumeHandler(config);
    const result = handler.processVolumeData(data);

    res.json({
      success: result.success,
      data: result.normalizedData,
      conversions: result.conversions,
      anomalies: result.anomalies,
      stats: result.stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante normalizzazione volume',
      details: (error as Error).message,
      code: 'VOLUME_NORMALIZATION_ERROR'
    });
  }
});

/**
 * GET /api/v1/transform/supported-sources
 * Lista fonti dati supportate
 */
router.get('/supported-sources', (req: Request, res: Response) => {
  res.json({
    success: true,
    sources: Object.values(SupportedDataSource),
    count: Object.values(SupportedDataSource).length,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/transform/stats
 * Statistiche del sistema di trasformazione
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const transformerStats = dataTransformer.getStats();
    const dateNormalizerStats = dateNormalizer.getStats();
    const priceAdjusterStats = priceAdjuster.getStats();
    const volumeHandlerConfig = volumeHandler.getConfig();

    res.json({
      success: true,
      stats: {
        transformer: transformerStats,
        dateNormalizer: dateNormalizerStats,
        priceAdjuster: priceAdjusterStats,
        volumeHandler: { config: volumeHandlerConfig }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante recupero statistiche',
      details: (error as Error).message,
      code: 'STATS_ERROR'
    });
  }
});

/**
 * POST /api/v1/transform/test
 * Test di trasformazione con dati campione
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { rawData, source } = req.body;

    if (!rawData || !source) {
      return res.status(400).json({
        success: false,
        error: 'rawData e source richiesti per test',
        code: 'MISSING_TEST_PARAMETERS'
      });
    }

    // Test parsing
    const parseTest = responseParser.testParsing(rawData, source as SupportedDataSource);
    
    // Test normalizzazione date se parsing riuscito
    let dateTest = null;
    if (parseTest.canParse && parseTest.preview.length > 0) {
      dateTest = dateNormalizer.testDateFormat(parseTest.preview[0].date);
    }

    // Test normalizzazione volume se parsing riuscito
    let volumeTest = null;
    if (parseTest.canParse && parseTest.preview.length > 0) {
      volumeTest = volumeHandler.testNormalization(parseTest.preview[0].volume);
    }

    res.json({
      success: true,
      tests: {
        parsing: parseTest,
        dateNormalization: dateTest,
        volumeNormalization: volumeTest
      },
      recommendations: [
        parseTest.canParse ? 'Parsing: OK' : 'Parsing: FAILED',
        dateTest?.recognized ? 'Date: OK' : 'Date: CHECK FORMAT',
        volumeTest?.canNormalize ? 'Volume: OK' : 'Volume: CHECK FORMAT'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante test',
      details: (error as Error).message,
      code: 'TEST_ERROR'
    });
  }
});

/**
 * GET /api/v1/transform/health
 * Health check del sistema di trasformazione
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    // Test rapido di tutti i componenti
    const testData = [{
      date: '2023-12-01',
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: '1.5M'
    }];

    const parseTest = responseParser.testParsing(testData, SupportedDataSource.ALPHA_VANTAGE);
    const dateTest = dateNormalizer.testDateFormat('2023-12-01');
    const volumeTest = volumeHandler.testNormalization('1.5M');

    const allHealthy = parseTest.canParse && dateTest.recognized && volumeTest.canNormalize;

    res.json({
      success: true,
      status: allHealthy ? 'HEALTHY' : 'DEGRADED',
      components: {
        parser: parseTest.canParse ? 'OK' : 'ERROR',
        dateNormalizer: dateTest.recognized ? 'OK' : 'ERROR',
        volumeHandler: volumeTest.canNormalize ? 'OK' : 'ERROR'
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 