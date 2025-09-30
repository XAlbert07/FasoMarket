// src/lib/categoriesCache.ts
// Cache ultra-léger pour les catégories - Version optimisée

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache simple en mémoire avec expiration automatique
class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérification d'expiration
    const isExpired = Date.now() - entry.timestamp > this.TTL;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Nettoyage automatique si le cache devient trop volumineux
    if (this.cache.size > 10) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Export d'une instance unique
export const categoriesCache = new SimpleCache();