// Client-side rate limiting and caching utilities
class RateLimitCache {
  private cache = new Map<string, { count: number; resetTime: number }>();
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Check if request is rate limited
  checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.cache.get(key);

    if (!record || now > record.resetTime) {
      // Create new window
      this.cache.set(key, { count: 1, resetTime: now + windowMs });
      return true; // Allow
    }

    if (record.count >= maxRequests) {
      return false; // Rate limited
    }

    // Increment count
    record.count++;
    return true; // Allow
  }

  // Cache API responses with TTL
  setCache(key: string, data: any, ttlMs: number = 300000): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  // Get cached data if not expired
  getCache(key: string): any | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    
    // Clean rate limit cache
    for (const [key, record] of this.cache.entries()) {
      if (now > record.resetTime) {
        this.cache.delete(key);
      }
    }

    // Clean request cache
    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      rateLimitEntries: this.cache.size,
      cachedRequests: this.requestCache.size
    };
  }
}

export const rateLimitCache = new RateLimitCache();

// Auto cleanup every 5 minutes
setInterval(() => {
  rateLimitCache.cleanup();
}, 5 * 60 * 1000);