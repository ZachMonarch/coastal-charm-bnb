import { useEffect, useState } from 'react';
import {
  applySalesIQTheme,
  getSalesIQConfig,
  loadSalesIQ,
  unloadSalesIQ,
  type SalesIQConfig,
} from '@/lib/salesiq';

function detectTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

/**
 * Loads Zoho SalesIQ on every route and syncs the chat UI theme with the site.
 * Consent gating was intentionally removed — the widget loads as soon as the
 * app mounts, gated only by the global `enabled` flag in the admin config.
 */
export default function SalesIQProvider() {
  const [config, setConfigState] = useState<SalesIQConfig>(() => getSalesIQConfig());

  useEffect(() => {
    const onConfig = (e: Event) => setConfigState((e as CustomEvent<SalesIQConfig>).detail);
    window.addEventListener('salesiq:config-changed', onConfig);
    return () => window.removeEventListener('salesiq:config-changed', onConfig);
  }, []);

  const allowed = config.enabled && !!config.widgetCode;

  useEffect(() => {
    if (!allowed) {
      unloadSalesIQ();
      return;
    }
    loadSalesIQ(config.widgetCode)
      .then(() => applySalesIQTheme(detectTheme()))
      .catch((err) => console.warn('[SalesIQ] load failed', err));
  }, [allowed, config.widgetCode]);

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

  return null;
}
