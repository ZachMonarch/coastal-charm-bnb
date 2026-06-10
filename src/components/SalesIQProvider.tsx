import { useEffect, useState } from 'react';
import {
  applySalesIQTheme,
  getConsent,
  getSalesIQConfig,
  loadSalesIQ,
  setConsent,
  unloadSalesIQ,
  type SalesIQConfig,
} from '@/lib/salesiq';
import { Button } from '@/components/ui/button';

function detectTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

/**
 * Loads Zoho SalesIQ on every route once consent is granted, syncs theme,
 * and shows a lightweight consent banner when needed.
 */
export default function SalesIQProvider() {
  const [config, setConfigState] = useState<SalesIQConfig>(() => getSalesIQConfig());
  const [consent, setConsentState] = useState<'granted' | 'denied' | null>(() => getConsent());

  // React to admin/config or consent changes from anywhere in the app.
  useEffect(() => {
    const onConfig = (e: Event) => setConfigState((e as CustomEvent<SalesIQConfig>).detail);
    const onConsent = (e: Event) =>
      setConsentState((e as CustomEvent<'granted' | 'denied'>).detail);
    window.addEventListener('salesiq:config-changed', onConfig);
    window.addEventListener('salesiq:consent-changed', onConsent);
    return () => {
      window.removeEventListener('salesiq:config-changed', onConfig);
      window.removeEventListener('salesiq:consent-changed', onConsent);
    };
  }, []);

  const allowed =
    config.enabled && (!config.requireConsent || consent === 'granted') && !!config.widgetCode;

  useEffect(() => {
    if (!allowed) {
      unloadSalesIQ();
      return;
    }
    loadSalesIQ(config.widgetCode)
      .then(() => applySalesIQTheme(detectTheme()))
      .catch((err) => console.warn('[SalesIQ] load failed', err));
  }, [allowed, config.widgetCode]);

  // Sync theme on dark-mode toggle and OS preference change.
  useEffect(() => {
    if (!allowed) return;
    const apply = () => applySalesIQTheme(detectTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', apply);
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mq.removeEventListener?.('change', apply);
      observer.disconnect();
    };
  }, [allowed]);

  if (!config.enabled || !config.requireConsent || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Live chat cookie consent"
      className="fixed bottom-6 right-6 z-[800] max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl"
    >
      <p className="text-sm text-card-foreground">
        We use Zoho SalesIQ to power live chat support. It sets cookies to remember your
        conversation. Allow it?
      </p>
      <div className="mt-3 flex gap-2 justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConsent('denied')}
          aria-label="Decline live chat cookies"
        >
          Decline
        </Button>
        <Button
          size="sm"
          onClick={() => setConsent('granted')}
          aria-label="Allow live chat cookies"
        >
          Allow chat
        </Button>
      </div>
    </div>
  );
}
