import { Request, Response, Router } from 'express';
import { Pool } from 'pg';

const router = Router();

// Health status interface
interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database?: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  };
  externalApis?: {
    alphaVantage?: 'ok' | 'error';
  };
  services: {
    [key: string]: 'ok' | 'error';
  };
}

// Main health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage:
        (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
        100,
    },
    services: {},
  };

  try {
    // Database health check (if DATABASE_URL is set)
    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const dbStartTime = Date.now();
      try {
        await pool.query('SELECT 1');
        healthStatus.database = {
          status: 'connected',
          responseTime: Date.now() - dbStartTime,
        };
      } catch (error) {
        healthStatus.database = { status: 'error' };
        healthStatus.status = 'error';
      } finally {
        await pool.end();
      }
    }

    // External APIs health check (Alpha Vantage)
    healthStatus.externalApis = {};
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=1min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        );
        healthStatus.externalApis.alphaVantage = response.ok ? 'ok' : 'error';
      } catch (error) {
        healthStatus.externalApis.alphaVantage = 'error';
      }
    }

    // Internal services status (static for now, can be extended)
    healthStatus.services = {
      express: 'ok',
      cors: 'ok',
      rateLimit: 'ok',
      sanitization: 'ok',
    };

    const responseTime = Date.now() - startTime;
    res.status(healthStatus.status === 'ok' ? 200 : 503).json({
      ...healthStatus,
      responseTime,
    });
  } catch (error) {
    healthStatus.status = 'error';
    res.status(503).json({
      ...healthStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
