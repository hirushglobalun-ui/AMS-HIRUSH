/**
 * File: services/aiCacheService.ts
 * Purpose: Multi-level fast memory caching engine with TTL and explicit invalidation.
 * Delivers <200ms deterministic query response times and minimizes Firestore read charges.
 * Author: Hirush Global AMS
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

// Cache statistics for AI Health Monitoring
let cacheHits = 0;
let cacheMisses = 0;

export const CacheTTL = {
  ATTENDANCE: 45 * 1000,        // 45 seconds (frequent check-ins)
  LEAVES: 60 * 1000,            // 60 seconds
  CRM: 3 * 60 * 1000,           // 3 minutes
  DOMAINS: 5 * 60 * 1000,       // 5 minutes
  HOLIDAYS: 60 * 60 * 1000,     // 1 hour
  USERS: 5 * 60 * 1000,         // 5 minutes
  EXECUTIVE: 60 * 1000,         // 60 seconds
};

/**
 * Retrieves an item from cache if present and unexpired.
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    cacheMisses++;
    return null;
  }

  cacheHits++;
  return entry.data as T;
}

/**
 * Stores an item in cache with the given TTL in milliseconds.
 */
export function setInCache<T>(key: string, data: T, ttlMs: number): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Explicit cache invalidation trigger.
 * Can invalidate by category (e.g. 'attendance', 'leaves', 'crm') or flush everything.
 */
export function invalidateAiCache(category?: 'attendance' | 'leaves' | 'crm' | 'domains' | 'holidays' | 'users' | 'all'): void {
  if (!category || category === 'all') {
    cacheStore.clear();
    return;
  }

  for (const key of cacheStore.keys()) {
    if (key.startsWith(category) || (category === 'attendance' && key.startsWith('executive'))) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Get cache performance statistics for health dashboard.
 */
export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? Math.round((cacheHits / total) * 100) : 0;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRatePercentage: hitRate,
    activeKeysCount: cacheStore.size,
  };
}
