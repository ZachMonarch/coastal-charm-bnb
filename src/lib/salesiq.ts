/**
 * Zoho SalesIQ helpers — load on consent, theme sync, lead push.
 * Docs: https://www.zoho.com/salesiq/help/developer-section/embed-code.html
 */

export interface SalesIQConfig {
  /** Widget code (the `wc=` param from the Zoho embed snippet) */
  widgetCode: string;
  /** Deprecated — kept for backward compatibility with stored configs. Ignored. */
  requireConsent?: boolean;
  /** Globally enable/disable the widget. */
  enabled: boolean;
}

const STORAGE_KEY = 'monarch:salesiq:config';

export const DEFAULT_SALESIQ_CONFIG: SalesIQConfig = {
  widgetCode:
    'siq72811652de7599a323f8b30ccdfca7e2460a8df28bc9041a69523f70fb9a460acfb19c59d4fb826396f07a76f37d0d19',
  requireConsent: false,
  enabled: true,
};

export function getSalesIQConfig(): SalesIQConfig {
  if (typeof window === 'undefined') return DEFAULT_SALESIQ_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SALESIQ_CONFIG;
    return { ...DEFAULT_SALESIQ_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SALESIQ_CONFIG;
  }
}

export function saveSalesIQConfig(cfg: SalesIQConfig) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent('salesiq:config-changed', { detail: cfg }));
}

/** @deprecated Consent gating removed. Kept as a no-op for callers. */
export function getConsent(): 'granted' | 'denied' | null {
  return 'granted';
}

/** @deprecated Consent gating removed. Kept as a no-op for callers. */
export function setConsent(_value: 'granted' | 'denied') {
  /* noop */
}

declare global {
  interface Window {
    $zoho?: any;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadSalesIQ(widgetCode: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  if (document.getElementById('zsiqscript')) return Promise.resolve();

  loadingPromise = new Promise((resolve, reject) => {
    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || { ready: () => {} };

    const script = document.createElement('script');
    script.id = 'zsiqscript';
    script.defer = true;
    script.src = `https://salesiq.zohopublic.com/widget?wc=${encodeURIComponent(widgetCode)}`;
    script.onload = () => resolve();
    script.onerror = (e) => {
      loadingPromise = null;
      reject(e);
    };
    document.body.appendChild(script);
  });
  return loadingPromise;
}

export function unloadSalesIQ() {
  const el = document.getElementById('zsiqscript');
  if (el) el.remove();
  document.querySelectorAll('[id^="zsiq"]').forEach((n) => n.remove());
  loadingPromise = null;
}

/** Apply light/dark theme via SalesIQ API once it is ready. */
export function applySalesIQTheme(mode: 'light' | 'dark') {
  if (typeof window === 'undefined' || !window.$zoho?.salesiq) return;
  const run = () => {
    try {
      window.$zoho.salesiq.floatwindow?.titleiconcolor?.(mode === 'dark' ? '#FFFFFF' : '#1a1a1a');
      window.$zoho.salesiq.theme?.apply?.(mode === 'dark' ? 'dark' : 'light');
    } catch {
      /* noop */
    }
  };
  if (typeof window.$zoho.salesiq.ready === 'function') {
    window.$zoho.salesiq.ready(run);
  } else {
    run();
  }
}

export interface SalesIQLead {
  name?: string;
  email?: string;
  phone?: string;
  /** Free-form metadata shown in the SalesIQ conversation panel. */
  info?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Push a lead to SalesIQ. Safe to call before the widget loads — the call is
 * queued via $zoho.salesiq.ready.
 */
export function pushSalesIQLead(lead: SalesIQLead, source: string) {
  if (typeof window === 'undefined') return;
  window.$zoho = window.$zoho || {};
  window.$zoho.salesiq = window.$zoho.salesiq || { ready: () => {} };

  const run = () => {
    try {
      const visitor = window.$zoho.salesiq.visitor;
      if (!visitor) return;
      if (lead.name) visitor.name(lead.name);
      if (lead.email) visitor.email(lead.email);
      if (lead.phone) visitor.contactnumber(lead.phone);
      visitor.info?.({
        source,
        submitted_at: new Date().toISOString(),
        ...Object.fromEntries(
          Object.entries(lead.info ?? {}).map(([k, v]) => [k, String(v ?? '')])
        ),
      });
      // Open a chat session tagged as a lead capture
      window.$zoho.salesiq.chat?.start?.();
    } catch {
      /* noop */
    }
  };

  if (typeof window.$zoho.salesiq.ready === 'function') {
    window.$zoho.salesiq.ready(run);
  }
}
