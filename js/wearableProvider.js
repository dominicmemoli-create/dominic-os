// wearableProvider.js — STUB for future wearable / health-data integration.
//
// V1 is 100% manual entry. There are NO secrets, NO OAuth, and NO network
// calls in this file. It exists so the Health page can call a stable interface
// today and a real provider (CSV import, then Google Health Connect / Health
// API — NOT the deprecated Google Fit) can be dropped in later without UI
// changes. See NEXT_STEPS.md for the integration plan.

export const WEARABLE_STATUS = {
  connected: false,
  provider: null,        // e.g. 'whoop' | 'fitbit' | 'health-connect'
  mode: 'manual',        // 'manual' (V1) -> 'csv' (V2) -> 'api' (V3)
};

// Returns whether a real provider is wired up. Always false in V1.
export function isConnected() {
  return WEARABLE_STATUS.connected;
}

// Placeholder. A real implementation would start an OAuth flow in V3.
export async function connect(/* provider */) {
  return { ok: false, reason: 'manual-only', message: 'Wearable sync is a future feature. Log recovery manually for now.' };
}

export async function disconnect() {
  return { ok: true };
}

// Fetch today's metrics from a provider. V1 returns null -> UI falls back to
// manual entry. Shape mirrors the manual sleepRecoveryLog fields.
export async function fetchDailyMetrics(/* dateKey */) {
  return null;
}

// V2 hook: parse an exported CSV (WHOOP/Fitbit) into sleepRecoveryLog rows.
// Left intentionally empty until a real CSV format is targeted.
export function parseCsv(/* text */) {
  return [];
}
