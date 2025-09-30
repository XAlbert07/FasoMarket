// lib/cache.ts - Système de cache intelligent pour FasoMarket

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  
  // Durées de cache par défaut (en millisecondes)
  private readonly DEFAULT_TTL = {
    profile: 10 * 60 * 1000,      // 10 minutes - profil change rarement
    categories: 30 * 60 * 1000,    // 30 minutes - catégories quasi statiques
    listings: 2 * 60 * 1000,       // 2 minutes - listings changent souvent
    avatar: 60 * 60 * 1000,        // 1 heure - avatars changent rarement
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresIn = ttl || this.DEFAULT_TTL.profile
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const isExpired = Date.now() - entry.timestamp > entry.expiresIn
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  clear(): void {
    this.cache.clear()
  }

  // Méthodes utilitaires pour les clés communes
  profileKey(userId: string): string {
    return `profile_${userId}`
  }

  avatarKey(userId: string): string {
    return `avatar_${userId}`
  }

  categoriesKey(): string {
    return 'categories_all'
  }
}

export const cache = new CacheManager()