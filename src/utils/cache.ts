// Cache utility functions

const CACHE_PREFIX = 'gh_cache_';
const DEFAULT_CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes Cache
const MAX_CACHE_ITEMS = 100; // Maximum number of cache items

interface CacheItem<T> {
  timestamp: number;
  data: T;
  duration?: number; // Optional custom duration for this item
}

interface CacheOptions {
  duration?: number; // Custom cache duration in milliseconds
  forceRefresh?: boolean; // Whether to force refresh the cache
}

/**
 * Clears all blog-related cache entries
 */
export const clearCache = (): void => {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log("Magic cache cleared.");
};

/**
 * Clears a specific cache entry by key
 * @param key Cache key
 */
export const clearCacheKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + key);
};

/**
 * Gets a cached item by key
 * @param key Cache key
 * @param options Cache options
 * @returns Cached data or null if not found or expired
 */
export const getCache = <T>(key: string, options: CacheOptions = {}): T | null => {
  if (typeof window === 'undefined') return null;
  
  const json = localStorage.getItem(CACHE_PREFIX + key);
  if (!json) return null;
  
  try {
    const { timestamp, data, duration } = JSON.parse(json) as CacheItem<T>;
    const cacheDuration = duration || DEFAULT_CACHE_DURATION;
    
    if (Date.now() - timestamp < cacheDuration && !options.forceRefresh) {
      return data;
    }
    
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    localStorage.removeItem(CACHE_PREFIX + key);
  }
  
  return null;
};

/**
 * Sets a cached item with a key and data
 * @param key Cache key
 * @param data Data to cache
 * @param options Cache options
 */
export const setCache = <T>(key: string, data: T, options: CacheOptions = {}): void => {
  if (typeof window === 'undefined') return;
  
  // Ensure we don't exceed cache size limit
  if (typeof window !== 'undefined') {
    const cacheKeys = Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .sort((a, b) => {
        const aItem = JSON.parse(localStorage.getItem(a) || '{}') as CacheItem<any>;
        const bItem = JSON.parse(localStorage.getItem(b) || '{}') as CacheItem<any>;
        return (aItem.timestamp || 0) - (bItem.timestamp || 0);
      });
    
    // Remove oldest items if we exceed the limit
    while (cacheKeys.length >= MAX_CACHE_ITEMS) {
      localStorage.removeItem(cacheKeys.shift() || '');
    }
  }
  
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
    timestamp: Date.now(),
    data,
    duration: options.duration
  }));
};

/**
 * Creates a cached async function
 * @param fn Async function to cache
 * @param getKey Function to generate cache key from arguments
 * @param defaultOptions Default cache options
 * @returns Cached version of the function
 */
export const withCache = <T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  getKey: (...args: A) => string,
  defaultOptions: CacheOptions = {}
): ((...args: A & [options?: CacheOptions]) => Promise<T>) => {
  return async (...args: any[]) => {
    const options = typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) 
      ? args.pop() as CacheOptions 
      : {};
    
    const mergedOptions = { ...defaultOptions, ...options };
    const key = getKey(...(args as A));
    
    const cached = getCache<T>(key, mergedOptions);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...(args as A));
    setCache(key, result, mergedOptions);
    return result;
  };
};

/**
 * Gets cache statistics
 * @returns Cache statistics object
 */
export const getCacheStats = (): {
  totalItems: number;
  totalSize: number;
  oldestItem?: number;
  newestItem?: number;
} => {
  if (typeof window === 'undefined') {
    return { totalItems: 0, totalSize: 0 };
  }
  
  const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  let totalSize = 0;
  let oldestTime = Infinity;
  let newestTime = 0;
  
  cacheKeys.forEach(key => {
    const value = localStorage.getItem(key) || '';
    totalSize += value.length;
    
    try {
      const item = JSON.parse(value) as CacheItem<any>;
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
      }
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp;
      }
    } catch (e) {
      // Ignore invalid cache items
    }
  });
  
  return {
    totalItems: cacheKeys.length,
    totalSize,
    oldestItem: oldestTime === Infinity ? undefined : oldestTime,
    newestItem: newestTime === 0 ? undefined : newestTime
  };
};

/**
 * Generates a cache key from multiple arguments
 * @param args Arguments to generate key from
 * @returns Generated cache key
 */
export const generateCacheKey = (...args: any[]): string => {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return JSON.stringify(arg);
    }
    return String(arg);
  }).join(':');
};
