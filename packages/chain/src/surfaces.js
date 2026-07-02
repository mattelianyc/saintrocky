export const SOLANA_TRADING_DOMAINS = [
  'pump.fun',
  'jup.ag',
  'raydium.io',
  'orca.so',
  'tensor.trade',
  'birdeye.so',
  'dexscreener.com',
  'photon-sol.tinyastro.io',
  'bullx.io',
  'gmgn.ai',
  'defined.fi',
  'step.finance'
];

export const SOLANA_TRADING_APPS = [
  'Phantom',
  'Solflare',
  'Backpack'
];

export const KNOWN_BROWSER_PROCESSES = [
  'safari',
  'firefox',
  'brave browser',
  'arc',
  'opera',
  'vivaldi',
  'microsoft edge',
  'google chrome',
  'chromium',
  'zen'
];

export function isSolanaTradingDomain(hostname) {
  const normalized = String(hostname || '').replace(/^www\./, '').toLowerCase();
  return SOLANA_TRADING_DOMAINS.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`)
  );
}

export function isSolanaTradingApp(processName) {
  const normalized = String(processName || '').trim().toLowerCase();
  return SOLANA_TRADING_APPS.some(
    (app) => normalized.includes(app.toLowerCase())
  );
}

export function isKnownBrowserProcess(processName) {
  const normalized = String(processName || '').trim().toLowerCase();
  return KNOWN_BROWSER_PROCESSES.some(
    (browser) => normalized.includes(browser)
  );
}
