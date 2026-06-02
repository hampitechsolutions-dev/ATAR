'use client';

const BUYER_FAVORITES_KEY = 'atar:buyer:favorites';
const SUPPLIER_SETTINGS_KEY = 'atar:supplier:settings';

export type SupplierSettings = {
  notificationsEnabled: boolean;
  autoRefreshEnabled: boolean;
  preferredCurrency: string;
};

const defaultSupplierSettings: SupplierSettings = {
  notificationsEnabled: true,
  autoRefreshEnabled: true,
  preferredCurrency: 'ARS',
};

export function loadBuyerFavorites() {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(BUYER_FAVORITES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveBuyerFavorites(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(BUYER_FAVORITES_KEY, JSON.stringify(ids));
}

export function toggleBuyerFavorite(id: string) {
  const current = loadBuyerFavorites();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  saveBuyerFavorites(next);
  return next;
}

export function loadSupplierSettings() {
  if (typeof window === 'undefined') {
    return defaultSupplierSettings;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_SETTINGS_KEY);
    if (!raw) {
      return defaultSupplierSettings;
    }

    return {
      ...defaultSupplierSettings,
      ...JSON.parse(raw),
    } as SupplierSettings;
  } catch {
    return defaultSupplierSettings;
  }
}

export function saveSupplierSettings(settings: SupplierSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SUPPLIER_SETTINGS_KEY, JSON.stringify(settings));
}
