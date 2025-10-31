import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { scanProcesses } from './processScanner.js';

const resolveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function createApiServer({ port, cacheMs } = {}) {
  const resolvedPort = resolveNumber(port ?? process.env.PORT, 4000);
  const resolvedCacheMs = resolveNumber(cacheMs ?? process.env.SCAN_CACHE_MS, 5000);

  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(express.json());
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
  app.use(morgan('tiny'));

  let lastScanResult = null;
  let lastScanTimestamp = 0;
  let serverRef = null;

  const defaultScanOptions = {
    minimumConfidence: 0.5,
    matchesRequired: 1,
    includeCommandLine: true,
  };

  const coerceBoolean = (value, fallback) => {
    if (value === undefined || value === null) {
      return fallback;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() !== 'false';
    }
    return Boolean(value);
  };

  const mergeScanOptions = (input = {}) => {
    const merged = { ...defaultScanOptions };

    if (input.minimumConfidence !== undefined) {
      const value = resolveNumber(input.minimumConfidence, merged.minimumConfidence);
      if (Number.isFinite(value)) {
        merged.minimumConfidence = value;
      }
    }

    if (input.matchesRequired !== undefined) {
      const value = resolveNumber(input.matchesRequired, merged.matchesRequired);
      if (Number.isFinite(value) && value >= 1) {
        merged.matchesRequired = Math.floor(value);
      }
    }

    if (input.includeCommandLine !== undefined) {
      merged.includeCommandLine = coerceBoolean(input.includeCommandLine, merged.includeCommandLine);
    }

    return merged;
  };

  const buildResponse = (cached) => ({
    cached,
    cacheAgeMs: cached ? Math.max(0, Date.now() - lastScanTimestamp) : 0,
    cacheWindowMs: resolvedCacheMs,
    ...lastScanResult,
  });

  const refreshScan = async (options) => {
    const mergedOptions = mergeScanOptions(options);
    lastScanResult = await scanProcesses(mergedOptions);
    lastScanTimestamp = Date.now();
    return buildResponse(false);
  };

  const ensureScan = async (options, forceRefresh = false) => {
    const cacheExpired = Date.now() - lastScanTimestamp > resolvedCacheMs;
    const shouldRefresh = forceRefresh || !lastScanResult || cacheExpired;
    if (shouldRefresh) {
      return refreshScan(options);
    }
    return buildResponse(true);
  };

  app.get('/health', (_req, res) => {
    res.json({
      status: serverRef?.listening ? 'ready' : 'initialising',
      timestamp: new Date().toISOString(),
      cacheWindowMs: resolvedCacheMs,
      lastScanTimestamp,
    });
  });

  app.get(['/scan', '/scan/refresh'], async (req, res) => {
    try {
      const forceRefresh = req.path.endsWith('/refresh');
      const result = await ensureScan(req.query, forceRefresh);
      res.json(result);
    } catch (error) {
      console.error('Scan failed:', error);
      res.status(500).json({
        error: 'scan_failed',
        message: error?.message || 'Unable to complete process scan',
      });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', message: `No route for ${req.path}` });
  });

  const start = () => new Promise((resolve, reject) => {
    if (serverRef) {
      return resolve({ server: serverRef, port: resolvedPort });
    }

    const server = app.listen(resolvedPort, () => {
      serverRef = server;
      console.log(`Camera manipulation detector API listening on port ${resolvedPort}`);
      resolve({ server: serverRef, port: resolvedPort });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });

  const stop = () => new Promise((resolve, reject) => {
    if (!serverRef) {
      return resolve();
    }
    serverRef.close((err) => {
      if (err) {
        reject(err);
      } else {
        serverRef = null;
        resolve();
      }
    });
  });

  const getStatus = () => ({
    running: Boolean(serverRef?.listening),
    port: resolvedPort,
    cacheWindowMs: resolvedCacheMs,
    lastScanTimestamp,
    lastScanResult,
  });

  return {
    app,
    start,
    stop,
    getStatus,
    scanNow: (options) => refreshScan(options),
  };
}

export async function startApiServer(options = {}) {
  const context = createApiServer(options);
  await context.start();
  return context;
}
