export const TEST_CONFIG = {
  minHitRate: 0.7,
  maxMemoryUsage: 0.8,
  maxAge: 24 * 60 * 60 * 1000, // 24 ore
  validationInterval: 5 * 60 * 1000, // 5 minuti
};

export const TEST_METRICS = {
  good: {
    hitRate: 0.85,
    memoryUsage: 0.5,
    lastUpdate: Date.now(),
  },
  badHitRate: {
    hitRate: 0.5,
    memoryUsage: 0.5,
    lastUpdate: Date.now(),
  },
  badMemory: {
    hitRate: 0.85,
    memoryUsage: 0.9,
    lastUpdate: Date.now(),
  },
  old: {
    hitRate: 0.85,
    memoryUsage: 0.5,
    lastUpdate: Date.now() - 25 * 60 * 60 * 1000, // 25 ore fa
  },
};
