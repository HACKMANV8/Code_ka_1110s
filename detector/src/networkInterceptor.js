import { session } from 'electron';

const PROTOCOLS = ['http', 'https', 'ws', 'wss'];

let activeListener = null;
let activePatterns = [];
let activeFilter = null;

const cleanDomain = (domain) => {
  if (typeof domain !== 'string') {
    return '';
  }
  return domain.trim().replace(/\s+/g, '').replace(/^\*+\./, '').toLowerCase();
};

const buildUrlPatterns = (domains = []) => {
  const patterns = new Set();

  for (const candidate of domains) {
    const domain = cleanDomain(candidate);
    if (!domain || domain.includes('/') || domain.includes(' ')) {
      continue;
    }

    const variants = new Set([domain]);
    if (!domain.startsWith('*.') && !domain.includes(':')) {
      variants.add(`*.${domain}`);
    }

    for (const variant of variants) {
      for (const protocol of PROTOCOLS) {
        patterns.add(`${protocol}://${variant}/*`);
      }
    }
  }

  return Array.from(patterns);
};

export const getInterceptorState = () => ({
  enabled: Boolean(activeListener),
  patterns: [...activePatterns],
});

const resetState = () => {
  activeListener = null;
  activePatterns = [];
  activeFilter = null;
};

export const enableNetworkInterceptor = (domains = []) => {
  if (!Array.isArray(domains) || domains.length === 0) {
    return { enabled: false, reason: 'no_domains' };
  }

  const defaultSession = session?.defaultSession;
  if (!defaultSession?.webRequest?.onBeforeRequest) {
    return { enabled: false, reason: 'no_session' };
  }

  const patterns = buildUrlPatterns(domains);
  if (patterns.length === 0) {
    return { enabled: false, reason: 'no_patterns' };
  }

  if (activeListener) {
    const disableResult = disableNetworkInterceptor();
    if (!disableResult.disabled && disableResult.reason !== 'not_enabled') {
      return {
        enabled: false,
        reason: 'cleanup_failed',
        error: disableResult.error,
        details: disableResult.reason,
      };
    }
  }

  const listener = (_details, callback) => {
    callback({ cancel: true });
  };

  try {
    const filter = { urls: patterns };
    defaultSession.webRequest.onBeforeRequest(filter, listener);
    activeListener = listener;
    activePatterns = patterns;
    activeFilter = filter;
    return { enabled: true, patterns };
  } catch (error) {
    resetState();
    return { enabled: false, reason: 'registration_failed', error: error.message };
  }
};

export const disableNetworkInterceptor = () => {
  const defaultSession = session?.defaultSession;
  if (!activeListener || !activeFilter) {
    return { disabled: false, reason: 'not_enabled' };
  }

  if (!defaultSession?.webRequest?.onBeforeRequest) {
    const error = new Error('No session available to remove interceptor');
    return { disabled: false, reason: 'no_session', error: error.message };
  }

  try {
    defaultSession.webRequest.onBeforeRequest(activeFilter, null);
    return { disabled: true };
  } catch (error) {
    return { disabled: false, reason: 'removal_failed', error: error.message };
  } finally {
    resetState();
  }
};
