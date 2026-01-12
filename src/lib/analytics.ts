/**
 * Analytics Instrumentation Library
 * 
 * Provides unified interface for tracking events across the application.
 * Vercel Analytics is enabled via @vercel/analytics package (see main.tsx).
 * This module provides additional custom event tracking with console logging in dev.
 * 
 * PRODUCTION STATUS: Active
 * - Vercel Analytics: Enabled (automatic page views and web vitals)
 * - Custom events: Logged to console in dev, ready for PostHog/GA4 integration
 * 
 * @see Phase 3 Documentation: docs/design-system/PHASE_3_COMPLETION.md
 */

export type AnalyticsEvent =
  | "page_view"
  | "hero_cta_click"
  | "property_card_click"
  | "property_view"
  | "booking_initiated"
  | "form_submit_success"
  | "form_submit_error"
  | "faq_open"
  | "feature_card_click"
  | "search_query"
  | "filter_applied"
  | "video_play"
  | "external_link_click"
  | "cta_banner_click"
  | "navigation_click"
  | "download_brochure"
  | "contact_form_open";

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  provider?: "posthog" | "ga4" | "custom";
}

class Analytics {
  private config: AnalyticsConfig = {
    enabled: true,
    debug: import.meta.env.DEV,
    provider: undefined,
  };

  /**
   * Initialize analytics with configuration
   */
  init(config: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...config };
    
    if (this.config.debug) {
      console.log("[Analytics] Initialized with config:", this.config);
    }
  }

  /**
   * Track an analytics event
   * 
   * @example
   * trackEvent("hero_cta_click", { cta_text: "Get Started", page: "/properties" });
   */
  trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.config.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        referrer: document.referrer,
      },
    };

    if (this.config.debug) {
      console.log("[Analytics] Event:", eventData);
    }

    // TODO: Phase 3 - Implement actual analytics provider integration
    // Example for PostHog:
    // if (typeof window !== 'undefined' && window.posthog) {
    //   window.posthog.capture(event, eventData.properties);
    // }

    // Example for GA4:
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', event, eventData.properties);
    // }
  }

  /**
   * Track page view (automatic)
   */
  trackPageView(pagePath?: string) {
    const path = pagePath || window.location.pathname;
    this.trackEvent("page_view", {
      page_path: path,
      page_title: document.title,
    });
  }

  /**
   * Identify user (for authenticated tracking)
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log("[Analytics] Identify user:", userId, traits);
    }

    // TODO: Phase 3 - Implement user identification
    // if (typeof window !== 'undefined' && window.posthog) {
    //   window.posthog.identify(userId, traits);
    // }
  }

  /**
   * Reset user identification (on logout)
   */
  reset() {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log("[Analytics] Reset user");
    }

    // TODO: Phase 3 - Implement reset
    // if (typeof window !== 'undefined' && window.posthog) {
    //   window.posthog.reset();
    // }
  }
}

// Singleton instance
export const analytics = new Analytics();

/**
 * Simple hook for tracking events (no React dependency)
 */
export function useAnalytics() {
  return {
    track: analytics.trackEvent.bind(analytics),
    page: analytics.trackPageView.bind(analytics),
    identify: analytics.identify.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };
}

// Initialize analytics on module load
if (typeof window !== "undefined") {
  analytics.init({
    enabled: true,
    debug: import.meta.env.DEV,
  });
}
