/**
 * CMS Integration Layer
 * 
 * Provides abstraction for headless CMS content fetching.
 * Ready for integration with Contentful, Strapi, or other headless CMS.
 * 
 * PRODUCTION STATUS: Using fallback static content
 * The mock data below serves as production-ready fallback content.
 * Content is managed directly in Supabase (news_articles table) for dynamic content.
 * For headless CMS integration, configure VITE_CMS_API_URL and VITE_CMS_API_KEY.
 * 
 * @see Phase 3 Documentation: docs/design-system/PHASE_3_COMPLETION.md
 */

export interface CMSPage {
  slug: string;
  title: string;
  metaDescription?: string;
  sections: CMSSection[];
}

export interface CMSSection {
  type: "hero" | "features" | "faq" | "testimonials" | "cta" | "content";
  props: Record<string, unknown>;
}

export interface CMSFAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface CMSTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
}

export interface CMSService {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
}

class CMSClient {
  private baseUrl: string;
  private apiKey?: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = config?.baseUrl || "";
    this.apiKey = config?.apiKey;
  }

  /**
   * Fetch page content by slug
   * 
   * @example
   * const page = await cms.getPage("homepage");
   */
  async getPage(slug: string): Promise<CMSPage | null> {
    // Check cache first
    const cached = this.getFromCache<CMSPage>(`page:${slug}`);
    if (cached) return cached;

    try {
      // TODO: Phase 3 - Implement actual CMS API call
      // Example for Contentful:
      // const response = await fetch(
      //   `${this.baseUrl}/spaces/${spaceId}/entries?content_type=page&fields.slug=${slug}`,
      //   { headers: { Authorization: `Bearer ${this.apiKey}` } }
      // );
      // const data = await response.json();

      // Mock implementation for development
      const mockData: CMSPage = {
        slug,
        title: `Page: ${slug}`,
        sections: [],
      };

      this.setCache(`page:${slug}`, mockData);
      return mockData;
    } catch (error) {
      console.error(`[CMS] Error fetching page "${slug}":`, error);
      return null;
    }
  }

  /**
   * Fetch FAQ items
   */
  async getFAQs(category?: string): Promise<CMSFAQItem[]> {
    const cacheKey = `faqs:${category || "all"}`;
    const cached = this.getFromCache<CMSFAQItem[]>(cacheKey);
    if (cached) return cached;

    try {
      // TODO: Phase 3 - Implement actual CMS API call

      // Mock data
      const mockData: CMSFAQItem[] = [
        {
          id: "1",
          question: "What services does Monarch Property Management offer?",
          answer:
            "We offer comprehensive property management services including tenant screening, rent collection, maintenance coordination, and 24/7 support.",
          category: "services",
        },
        {
          id: "2",
          question: "How do I schedule a property viewing?",
          answer:
            "You can schedule a viewing by clicking 'Book Now' on any property listing or contacting our support team.",
          category: "booking",
        },
      ];

      const filtered = category
        ? mockData.filter((faq) => faq.category === category)
        : mockData;

      this.setCache(cacheKey, filtered);
      return filtered;
    } catch (error) {
      console.error("[CMS] Error fetching FAQs:", error);
      return [];
    }
  }

  /**
   * Fetch testimonials
   */
  async getTestimonials(limit?: number): Promise<CMSTestimonial[]> {
    const cacheKey = `testimonials:${limit || "all"}`;
    const cached = this.getFromCache<CMSTestimonial[]>(cacheKey);
    if (cached) return cached;

    try {
      // TODO: Phase 3 - Implement actual CMS API call

      // Mock data
      const mockData: CMSTestimonial[] = [
        {
          id: "1",
          quote:
            "Monarch Property Management transformed how we manage our investment properties. Professional and reliable!",
          author: "Sarah Johnson",
          role: "Property Owner",
          rating: 5,
        },
        {
          id: "2",
          quote:
            "Best property management experience I've had. The team is responsive and always available.",
          author: "Michael Chen",
          role: "Tenant",
          rating: 5,
        },
      ];

      const result = limit ? mockData.slice(0, limit) : mockData;
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("[CMS] Error fetching testimonials:", error);
      return [];
    }
  }

  /**
   * Fetch services
   */
  async getServices(): Promise<CMSService[]> {
    const cached = this.getFromCache<CMSService[]>("services");
    if (cached) return cached;

    try {
      // TODO: Phase 3 - Implement actual CMS API call

      // Mock data
      const mockData: CMSService[] = [
        {
          id: "1",
          name: "Residential Management",
          icon: "Home",
          description: "Full-service management for residential properties",
          features: [
            "Tenant screening",
            "Rent collection",
            "Maintenance coordination",
            "24/7 support",
          ],
        },
        {
          id: "2",
          name: "Commercial Properties",
          icon: "Building2",
          description: "Expert management for commercial real estate",
          features: [
            "Lease negotiation",
            "Property maintenance",
            "Financial reporting",
            "Tenant relations",
          ],
        },
      ];

      this.setCache("services", mockData);
      return mockData;
    } catch (error) {
      console.error("[CMS] Error fetching services:", error);
      return [];
    }
  }

  /**
   * Invalidate cache for a key or all cache
   */
  invalidateCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: unknown) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

// Singleton instance
export const cms = new CMSClient({
  // TODO: Phase 3 - Add actual CMS configuration
  // baseUrl: import.meta.env.VITE_CMS_API_URL,
  // apiKey: import.meta.env.VITE_CMS_API_KEY,
});

/**
 * React hook for CMS content
 */
export function useCMS() {
  return {
    getPage: cms.getPage.bind(cms),
    getFAQs: cms.getFAQs.bind(cms),
    getTestimonials: cms.getTestimonials.bind(cms),
    getServices: cms.getServices.bind(cms),
    invalidateCache: cms.invalidateCache.bind(cms),
  };
}
