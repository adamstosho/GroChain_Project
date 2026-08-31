'use client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class OfflineCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('grochain-cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('grochain-cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  private cleanExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  set<T>(key: string, data: T, expiryMs?: number): void {
    const expiry = Date.now() + (expiryMs || this.DEFAULT_EXPIRY);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
    });
    this.saveToStorage();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  // Specific methods for GroChain data
  setHarvests(harvests: unknown[]): void {
    this.set('harvests', harvests, 2 * 60 * 60 * 1000); // 2 hours
  }

  getHarvests(): unknown[] | null {
    return this.get<unknown[]>('harvests');
  }

  setShipments(shipments: unknown[]): void {
    this.set('shipments', shipments, 2 * 60 * 60 * 1000); // 2 hours
  }

  getShipments(): unknown[] | null {
    return this.get<unknown[]>('shipments');
  }

  setMarketplaceListings(listings: unknown[]): void {
    this.set('marketplace-listings', listings, 30 * 60 * 1000); // 30 minutes
  }

  getMarketplaceListings(): unknown[] | null {
    return this.get<unknown[]>('marketplace-listings');
  }

  setUserProfile(profile: unknown): void {
    this.set('user-profile', profile, 60 * 60 * 1000); // 1 hour
  }

  getUserProfile(): unknown | null {
    return this.get('user-profile');
  }

  setOrders(orders: unknown[]): void {
    this.set('orders', orders, 60 * 60 * 1000); // 1 hour
  }

  getOrders(): unknown[] | null {
    return this.get<unknown[]>('orders');
  }

  // Cache key generators
  static getHarvestKey(id: string): string {
    return `harvest-${id}`;
  }

  static getShipmentKey(id: string): string {
    return `shipment-${id}`;
  }

  static getListingKey(id: string): string {
    return `listing-${id}`;
  }

  static getOrderKey(id: string): string {
    return `order-${id}`;
  }
}

export const offlineCache = new OfflineCache();
export default offlineCache;



