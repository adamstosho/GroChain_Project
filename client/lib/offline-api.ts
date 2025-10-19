'use client';

import { apiService } from './api';
import { useOffline } from '@/hooks/use-offline';

interface OfflineApiOptions {
  endpoint: string;
  data: any;
  method: 'POST' | 'PUT' | 'DELETE';
  type: 'harvest' | 'shipment' | 'listing' | 'order';
  action: 'create' | 'update' | 'delete';
}

class OfflineApiService {
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async makeRequest(options: OfflineApiOptions, offlineHook: ReturnType<typeof useOffline>) {
    const { endpoint, data, method, type, action } = options;
    
    // If offline, queue the action
    if (offlineHook.isOffline) {
      const offlineAction = {
        id: this.generateId(),
        type,
        data,
        timestamp: Date.now(),
        action
      };
      
      offlineHook.addOfflineAction(offlineAction);
      
      return {
        success: true,
        queued: true,
        message: `${type} ${action} queued for sync when online`,
        offlineAction
      };
    }
    
    // If online, make the actual API call
    try {
      let response;
      switch (method) {
        case 'POST':
          response = await apiService.post(endpoint, data);
          break;
        case 'PUT':
          response = await apiService.put(endpoint, data);
          break;
        case 'DELETE':
          response = await apiService.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      return {
        success: true,
        queued: false,
        data: response.data,
        message: `${type} ${action} completed successfully`
      };
    } catch (error: any) {
      // If API call fails and we're online, queue it for retry
      const offlineAction = {
        id: this.generateId(),
        type,
        data,
        timestamp: Date.now(),
        action
      };
      
      offlineHook.addOfflineAction(offlineAction);
      
      return {
        success: false,
        queued: true,
        error: error.message,
        message: `API call failed, ${type} ${action} queued for retry`,
        offlineAction
      };
    }
  }

  // Convenience methods for common operations
  async createHarvest(data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/harvests',
      data,
      method: 'POST',
      type: 'harvest',
      action: 'create'
    }, offlineHook);
  }

  async updateHarvest(harvestId: string, data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/harvests/${harvestId}`,
      data,
      method: 'PUT',
      type: 'harvest',
      action: 'update'
    }, offlineHook);
  }

  async createShipment(data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/shipments',
      data,
      method: 'POST',
      type: 'shipment',
      action: 'create'
    }, offlineHook);
  }

  async updateShipment(shipmentId: string, data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/shipments/${shipmentId}`,
      data,
      method: 'PUT',
      type: 'shipment',
      action: 'update'
    }, offlineHook);
  }

  async createListing(data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/marketplace/listings',
      data,
      method: 'POST',
      type: 'listing',
      action: 'create'
    }, offlineHook);
  }

  async updateListing(listingId: string, data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/marketplace/listings/${listingId}`,
      data,
      method: 'PUT',
      type: 'listing',
      action: 'update'
    }, offlineHook);
  }

  async createOrder(data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/marketplace/orders',
      data,
      method: 'POST',
      type: 'order',
      action: 'create'
    }, offlineHook);
  }

  async updateOrder(orderId: string, data: any, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/marketplace/orders/${orderId}`,
      data,
      method: 'PUT',
      type: 'order',
      action: 'update'
    }, offlineHook);
  }
}

export const offlineApiService = new OfflineApiService();
export default offlineApiService;
