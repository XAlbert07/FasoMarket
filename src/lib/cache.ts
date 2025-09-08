// lib/cache.ts
const sellerProfileCache = new Map();

export const getCachedSellerProfile = (sellerId: string) => {
  return sellerProfileCache.get(sellerId);
};

export const setCachedSellerProfile = (sellerId: string, data: any) => {
  sellerProfileCache.set(sellerId, {
    data,
    timestamp: Date.now(),
    expires: Date.now() + (5 * 60 * 1000) // 5 minutes
  });
};