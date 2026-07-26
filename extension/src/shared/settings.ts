import { HOSTED_API_BASE } from './config.js';
import type { FilaryLocale, FilarySettings } from './types.js';

export const DEFAULT_SETTINGS: FilarySettings = {
  serverUrl: HOSTED_API_BASE,
  fillMode: 'empty',
  includePasswords: false,
  defaultPassword: '',
  locale: 'en-NG',
  emailDomains: 'gmail.com, yahoo.com, outlook.com',
};

const STORAGE_KEY = 'filarySettings';

const LOCALES = new Set<FilaryLocale>([
  'en-NG',
  'yo-NG',
  'en-US',
  'en-GB',
  'en-GH',
  'en-ZA',
  'en-IN',
  'en-CA',
  'en-AU',
]);

function normalizeLocale(value: unknown): FilaryLocale {
  if (typeof value === 'string' && LOCALES.has(value as FilaryLocale)) {
    return value as FilaryLocale;
  }
  return DEFAULT_SETTINGS.locale;
}

export async function getSettings(): Promise<FilarySettings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as
    | (Partial<FilarySettings> & { localeHint?: string })
    | undefined;
  if (!stored) return { ...DEFAULT_SETTINGS };

  const locale = normalizeLocale(stored.locale ?? stored.localeHint);

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    locale,
    emailDomains:
      typeof stored.emailDomains === 'string' && stored.emailDomains.trim()
        ? stored.emailDomains
        : DEFAULT_SETTINGS.emailDomains,
  };
}

export async function saveSettings(settings: FilarySettings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

export function apiUrl(serverUrl: string, path: string): string {
  const base = serverUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
