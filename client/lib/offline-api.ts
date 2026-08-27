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

  private shouldQueueForRetry(error: any): boolean {
    const status = error?.status;
    if (typeof status === 'number') {
      // Client/validation errors should surface to the user, not be queued.
      if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
      if (status >= 500 || status === 408 || status === 429) {
        return true;
      }
    }

    const message = String(error?.message || '');
    return (
      error instanceof TypeError ||
      message.includes('Network error') ||
      message.includes('Unable to connect') ||
      message.includes('Request timeout')
    );
  }

  private queueAction(
    offlineHook: ReturnType<typeof useOffline>,
    type: OfflineApiOptions['type'],
    data: any,
    action: OfflineApiOptions['action']
  ) {
    const offlineAction = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      action,
    };
    offlineHook.addOfflineAction(offlineAction);
    return offlineAction;
  }

  async makeRequest(options: OfflineApiOptions, offlineHook: ReturnType<typeof useOffline>) {
    const { endpoint, data, method, type, action } = options;
    
    // If offline, queue the action
    if (offlineHook.isOffline) {
      const offlineAction = this.queueAction(offlineHook, type, data, action);
      
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
        data: response,
        message: `${type} ${action} completed successfully`
      };
    } catch (error: any) {
      if (!this.shouldQueueForRetry(error)) {
        return {
          success: false,
          queued: false,
          error: error.message,
          message: error.message,
        };
      }

      const offlineAction = this.queueAction(offlineHook, type, data, action);
      
      return {
        success: false,
        queued: true,
        error: error.message,
        message: `Connection issue detected, ${type} ${action} queued for retry`,
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
    const { idempotencyKey, ...payload } = data || {}

    if (offlineHook.isOffline) {
      const offlineAction = {
        id: this.generateId(),
        type: 'order' as const,
        data: { ...payload, idempotencyKey },
        timestamp: Date.now(),
        action: 'create' as const
      }
      offlineHook.addOfflineAction(offlineAction)
      return {
        success: true,
        queued: true,
        message: 'order create queued for sync when online',
        offlineAction
      }
    }

    try {
      const response = await apiService.createOrder(
        payload,
        idempotencyKey ? { idempotencyKey: String(idempotencyKey) } : undefined
      )
      return {
        success: true,
        queued: false,
        data: response.data,
        message: 'order create completed successfully'
      }
    } catch (error: any) {
      const offlineAction = {
        id: this.generateId(),
        type: 'order' as const,
        data: { ...payload, idempotencyKey },
        timestamp: Date.now(),
        action: 'create' as const
      }
      offlineHook.addOfflineAction(offlineAction)
      return {
        success: false,
        queued: true,
        error: error.message,
        message: 'order create failed, queued for retry'
      }
    }
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
