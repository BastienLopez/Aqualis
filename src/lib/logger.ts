import { FEATURES } from "@/lib/featureFlags";

const isDev = import.meta.env.DEV;

type LogData = Record<string, unknown>;

/**
 * Structured logger for Aquarium app.
 * - info/debug: only logged in development builds
 * - warn: always logged
 * - error: always logged (hook into crash reporter here when available)
 */
export const log = {
  debug: (msg: string, data?: LogData) => {
    if (isDev) console.debug(`[AQ] ${msg}`, ...(data ? [data] : []));
  },
  info: (msg: string, data?: LogData) => {
    if (isDev) console.info(`[AQ] ${msg}`, ...(data ? [data] : []));
  },
  warn: (msg: string, data?: LogData) => {
    console.warn(`[AQ] ⚠️ ${msg}`, ...(data ? [data] : []));
  },
  error: (msg: string, err?: unknown, data?: LogData) => {
    console.error(`[AQ] ❌ ${msg}`, err ?? "", ...(data ? [data] : []));
    // TODO: when Sentry is integrated, call Sentry.captureException(err) here
  },
};

// Validate feature flags on startup in dev
if (isDev) {
  log.debug("Feature flags", FEATURES as unknown as LogData);
}
